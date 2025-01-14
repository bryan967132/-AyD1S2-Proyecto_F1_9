import db from "../utils/db_connection.mjs"
import {transporter, shareMail} from "../email/nodemailer.mjs"


const shareItem = async (req, res) => {

    const { userIdentifier, idFile, currentUserId, type } = req.body;

    try {
        const currentUser = await db.query("SELECT * FROM USUARIO WHERE ID_USUARIO = ?", [currentUserId]);
        if (currentUser[0].length === 0) {
            return res.status(404).json({ "status": 404, "message": "User not found" });
        }

        const [dataCurrentUser, fields] = currentUser

        // validamos si el current user no es el destinatario

        if (dataCurrentUser[0].EMAIL === userIdentifier || dataCurrentUser[0].USUARIO === userIdentifier) {
            return res.status(400).json({ "status": 400, "message": "You cannot share the file with yourself" });
        }

        // validamos si el usuario destino existe

        const destinationUser = await db.query("SELECT * FROM USUARIO WHERE EMAIL = ? OR USUARIO = ?", [userIdentifier, userIdentifier]);

        if (destinationUser[0].length === 0) {
            return res.status(404).json({ "status": 404, "message": "User not found" });
        }

        const [dataDestinationUser, fields2] = destinationUser

        //validamos que el usuario destino sea de tipo cliente

        if (dataDestinationUser[0].ROL !== 2) {
            return res.status(400).json({ "status": 400, "message": "You can't share files with this user" });
        }


        if (type === 'file') {
            // validamos si el archivo ya fue compartido

            const sharedFile = await db.query("SELECT * FROM COMPARTIR WHERE ID_USUARIO_PROPIETARIO = ? AND ID_USUARIO_DESTINO = ? AND ID_ARCHIVO = ?", [currentUserId, dataDestinationUser[0].ID_USUARIO, idFile]);

            if (sharedFile[0].length > 0) {
                return res.status(400).json({ "status": 400, "message": "The file has already been shared with the user" });
            }

            const file = await db.query("SELECT * FROM ARCHIVO WHERE ID_ARCHIVO = ?", [idFile]);
            if (file[0].length === 0) {
                return res.status(404).json({ "status": 404, "message": "File not found" });
            }

            const [dataFile, fields3] = file

            await db.query("INSERT INTO COMPARTIR (ID_USUARIO_PROPIETARIO, ID_USUARIO_DESTINO, TIPO_COMPARTIR, ID_ARCHIVO, ID_CARPETA, FECHA_COMPARTIR) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)", [currentUserId, dataDestinationUser[0].ID_USUARIO, 1, idFile, null]);

            //enviar email al usuario destino
            sendEmail(dataDestinationUser[0].EMAIL, dataCurrentUser[0].USUARIO, dataDestinationUser[0].USUARIO, dataFile[0].NOMBRE);

            return res.status(200).json({ "status": 200, "message": "File shared successfully" });
        } else if (type === 'folder') {

            // validamos si la carpeta ya fue compartida

            const sharedFolder = await db.query("SELECT * FROM COMPARTIR WHERE ID_USUARIO_PROPIETARIO = ? AND ID_USUARIO_DESTINO = ? AND ID_CARPETA = ?", [currentUserId, dataDestinationUser[0].ID_USUARIO, idFile]);

            if (sharedFolder[0].length > 0) {
                return res.status(400).json({ "status": 400, "message": "The folder has already been shared with the user" });
            }

            const folder = await db.query("SELECT * FROM CARPETA WHERE ID_CARPETA = ?", [idFile]);
            if (folder[0].length === 0) {
                return res.status(404).json({ "status": 404, "message": "Folder not found" });
            }

            const [dataFolder, fields4] = folder

            await db.query("INSERT INTO COMPARTIR (ID_USUARIO_PROPIETARIO, ID_USUARIO_DESTINO, TIPO_COMPARTIR, ID_ARCHIVO, ID_CARPETA, FECHA_COMPARTIR) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)", [currentUserId, dataDestinationUser[0].ID_USUARIO, 2, null, idFile]);

            //enviar email al usuario destino

            sendEmail(dataDestinationUser[0].EMAIL, dataCurrentUser[0].USUARIO, dataDestinationUser[0].USUARIO, dataFolder[0].NOMBRE);

            return res.status(200).json({ "status": 200, "message": "Folder shared successfully" });
        }
    }
    catch (error) {
        console.error("Error sharing the file:", error);
        return res.status(500).json({ "status": 500, "message": "Error sharing the file" });
    }
}

const getSharedWithMeItems = async (req, res) => {

    const { idUsuario } = req.body;

    if (!idUsuario) {
        return res.status(400).json({ "status": 400, "message": "User ID is required" });
    }

    try {

        const [sharedFolders, fields] = await db.query(`select ca.*, u.USUARIO as PROPIETARIO, co.FECHA_COMPARTIR, 
                                                (  SELECT SUM(CANT)
                                                FROM (
                                                SELECT COUNT(*) CANT FROM CARPETA WHERE CARPETA.ID_CARPETA_PADRE = ca.ID_CARPETA 
                                                UNION 
                                                SELECT COUNT(*) FROM ARCHIVO WHERE ARCHIVO.ID_CARPETA = ca.ID_CARPETA
                                                ) AS CHILDREN
                                                ) AS CHILDREN
                                            from COMPARTIR co 
                                            inner join CARPETA ca 
                                            on co.ID_CARPETA = ca.ID_CARPETA
                                            inner join USUARIO u 
                                            on co.ID_USUARIO_PROPIETARIO = u.ID_USUARIO
                                            WHERE co.ID_USUARIO_DESTINO = ?  AND ca.ELIMINADO = 0`, [idUsuario]);

        const [sharedFiles, fields2] = await db.query(`select a.*, u.USUARIO as PROPIETARIO, co.FECHA_COMPARTIR
                                            from COMPARTIR co 
                                            inner join ARCHIVO a 
                                            on co.ID_ARCHIVO = a.ID_ARCHIVO
                                            inner join USUARIO u 
                                            on co.ID_USUARIO_PROPIETARIO = u.ID_USUARIO
                                            WHERE co.ID_USUARIO_DESTINO = ? AND a.ELIMINADO = 0`, [idUsuario]);

        const folders = sharedFolders.map(folder => {
            return {
                id: folder.ID_CARPETA,
                name: folder.NOMBRE,
                type: 'folder',
                created: folder.CREA,
                modified: folder.MODIFICA,
                createdDate: folder.CREACION,
                modifiedDate: folder.MODIFICACION,
                children: folder.CHILDREN,
                owner: folder.PROPIETARIO,
                sharedDate: folder.FECHA_COMPARTIR
            }
        });

        const files = sharedFiles.map(file => {
            return {
                id: file.ID_ARCHIVO,
                name: file.NOMBRE,
                type: 'file',
                created: file.CREA,
                modified: file.MODIFICA,
                createdDate: file.CREACION,
                modifiedDate: file.MODIFICACION,
                size: file.TAMANO_B,
                key: file.KEY_S3,
                owner: file.PROPIETARIO,
                sharedDate: file.FECHA_COMPARTIR
            }
        });

        return res.status(200).json({ status: 200, children: [...folders, ...files] })

    } catch (error) {
        console.error("Error getting the shared items:", error);
        return res.status(500).json({ "status": 500, "message": "Error getting the shared items" });
    }

}


const showSharedIconInSideBar = async (req, res) => { // verifica si el usuario tiene archivos compartidos para mostrar el icono en el sidebar

    const { idUsuario } = req.body;

    if (!idUsuario) {
        return res.status(400).json({ "status": 400, "message": "User ID is required" });
    }

    // validamos si el usuario tiene archivos compartidos con un COUNT
    try {

        const [sharedItems, fields] = await db.query(`SELECT COUNT(*) AS CANTIDAD FROM COMPARTIR WHERE ID_USUARIO_DESTINO = ?`, [idUsuario]);

        if (sharedItems[0].CANTIDAD > 0) {
            return res.status(200).json({ status: 200, icon: true });
        } else {
            return res.status(200).json({ status: 200, icon: false });
        }

    } catch (error) {
        console.error("Error getting the shared items:", error);
        return res.status(500).json({ "status": 500, "message": "Error getting the shared items" });
    }
}


const getUsersWithItemShared = async (req, res) => { //obtener los usuarios con los que se ha compartido un archivo

    const { idItem, type } = req.body;

    if (!idItem || !type) {
        return res.status(400).json({ "status": 400, "message": "Item ID and type are required" });
    }   

    try {
        if (type === 'file') {
            const [users, fields] = await db.query(`SELECT u.ID_USUARIO, u.USUARIO, u.EMAIL FROM COMPARTIR c INNER JOIN USUARIO u ON c.ID_USUARIO_DESTINO = u.ID_USUARIO WHERE c.ID_ARCHIVO = ?`, [idItem]);

            return res.status(200).json({ status: 200, users: users });
        } else if (type === 'folder') {
            const [users, fields] = await db.query(`SELECT u.ID_USUARIO, u.USUARIO, u.EMAIL FROM COMPARTIR c INNER JOIN USUARIO u ON c.ID_USUARIO_DESTINO = u.ID_USUARIO WHERE c.ID_CARPETA = ?`, [idItem]);
            return res.status(200).json({ status: 200, users: users });
        }
    } catch (error) {
        console.error("Error getting the users with whom the item has been shared:", error);
        return res.status(500).json({ "status": 500, "message": "Error getting the users with whom the item has been shared" });
    }

}

const stopSharingItem = async (req, res) => {

    const { idItem, type, idUser } = req.body;

    if (!idItem || !type || !idUser) {
        return res.status(400).json({ "status": 400, "message": "Item ID, type and user ID are required" });
    }

    try {
        if (type === 'file') {
            await db.query(`DELETE FROM COMPARTIR WHERE ID_ARCHIVO = ? AND ID_USUARIO_DESTINO = ?`, [idItem, idUser]);
            return res.status(200).json({ status: 200, message: "File unshared successfully" });
        } else if (type === 'folder') {
            await db.query(`DELETE FROM COMPARTIR WHERE ID_CARPETA = ? AND ID_USUARIO_DESTINO = ?`, [idItem, idUser]);
            return res.status(200).json({ status: 200, message: "Folder unshared successfully" });
        }
    } catch (error) {
        console.error("Error unsharing the item:", error);
        return res.status(500).json({ "status": 500, "message": "Error unsharing the item" });
    }
        
}

const sendEmail = async (email, owner, destinationUser, item) => { //enviar email para notificar que se ha compartido un archivo
    
        try {
            const mailOptions = shareMail(email, owner, destinationUser, item);
            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error("Error sending the email:", error);
        }
}

export const shareItems = {
    shareItem, 
    getSharedWithMeItems,
    showSharedIconInSideBar,
    getUsersWithItemShared,
    stopSharingItem
};