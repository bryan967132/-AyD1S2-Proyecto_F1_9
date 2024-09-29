DROP DATABASE IF EXISTS AYD_STORAGE;
CREATE DATABASE AYD_STORAGE;
USE AYD_STORAGE;

CREATE TABLE ROL (
    ID_ROL INT PRIMARY KEY,
    NOMBRE VARCHAR(50) NOT NULL,
    CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CREA VARCHAR(50) DEFAULT 'SYSTEM',
    MODIFICACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    MODIFICA VARCHAR(50) DEFAULT 'SYSTEM',
    CONSTRAINT ROL_UNIQUE UNIQUE (NOMBRE)
);

CREATE TABLE PAIS (
    ID_PAIS INT PRIMARY KEY,
    NOMBRE VARCHAR(50) NOT NULL,
    CODIGO VARCHAR(50) NOT NULL,
    CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CREA VARCHAR(50) DEFAULT 'SYSTEM',
    MODIFICACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    MODIFICA VARCHAR(50) DEFAULT 'SYSTEM',
    CONSTRAINT PAIS_UNIQUE UNIQUE (NOMBRE)
);

CREATE TABLE USUARIO (
    ID_USUARIO INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE VARCHAR(50) NOT NULL,
    APELLIDO VARCHAR(50) NOT NULL,
    USUARIO VARCHAR(50) NOT NULL,
    CONTRASENA VARCHAR(150) NOT NULL,
    EMAIL VARCHAR(100) NOT NULL,
    CELULAR VARCHAR(15) NOT NULL,
    PAIS_RESIDENCIA INT NOT NULL,
    NACIONALIDAD VARCHAR(50) NOT NULL,
    ROL INT NOT NULL,
    CONFIRMADO BOOLEAN DEFAULT FALSE,
    CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CREA VARCHAR(50) DEFAULT 'SYSTEM',
    MODIFICACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    MODIFICA VARCHAR(50) DEFAULT 'SYSTEM',
    CONSTRAINT USUARIO_USUARIO_UNIQUE UNIQUE (USUARIO),
    CONSTRAINT USUARIO_EMAIL_UNIQUE UNIQUE (EMAIL),
    CONSTRAINT USUARIO_FK_ROL FOREIGN KEY (ROL) REFERENCES ROL(ID_ROL),
    CONSTRAINT USUARIO_FK_PAIS FOREIGN KEY (PAIS_RESIDENCIA) REFERENCES PAIS(ID_PAIS)
);

CREATE TABLE PAQUETE (
    ID_PAQUETE INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE VARCHAR(50) NOT NULL,
    CAPACIDAD_GB INT NOT NULL,
    CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CREA VARCHAR(50) DEFAULT 'SYSTEM',
    MODIFICACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    MODIFICA VARCHAR(50) DEFAULT 'SYSTEM',
    CONSTRAINT PAQUETE_UNIQUE UNIQUE (NOMBRE)
);

CREATE TABLE CUENTA (
    ID_CUENTA INT PRIMARY KEY AUTO_INCREMENT,
    ID_USUARIO INT NOT NULL,
    ID_PAQUETE INT NOT NULL,
    FECHA_CREACION DATE NOT NULL,
    ELIMINADO BOOLEAN DEFAULT FALSE,
    CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CREA VARCHAR(50) DEFAULT 'SYSTEM',
    MODIFICACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    MODIFICA VARCHAR(50) DEFAULT 'SYSTEM',
    CONSTRAINT CUENTA_FK_USUARIO FOREIGN KEY (ID_USUARIO) REFERENCES USUARIO(ID_USUARIO),
    CONSTRAINT CUENTA_FK_PAQUETE FOREIGN KEY (ID_PAQUETE) REFERENCES PAQUETE(ID_PAQUETE)
);

CREATE TABLE CARPETA (
    ID_CARPETA INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE VARCHAR(50) NOT NULL,
    ID_CARPETA_PADRE INT,
    ID_CUENTA INT NOT NULL,
    ELIMINADO BOOLEAN DEFAULT FALSE,
    CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CREA VARCHAR(50) DEFAULT 'SYSTEM',
    MODIFICACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    MODIFICA VARCHAR(50) DEFAULT 'SYSTEM',
    CONSTRAINT CARPETA_FK_CARPETA_PADRE FOREIGN KEY (ID_CARPETA_PADRE) REFERENCES CARPETA(ID_CARPETA) ON DELETE CASCADE,
    CONSTRAINT CARPETA_FK_CUENTA FOREIGN KEY (ID_CUENTA) REFERENCES CUENTA(ID_CUENTA)
);

CREATE TABLE ARCHIVO (
    ID_ARCHIVO INT PRIMARY KEY AUTO_INCREMENT,
    NOMBRE VARCHAR(100) NOT NULL,
    ID_CARPETA INT NOT NULL,
    TAMANO_B INT NOT NULL,
    KEY_S3 VARCHAR(255) NOT NULL,
    FECHA_CREACION DATE NOT NULL,
    ELIMINADO BOOLEAN DEFAULT FALSE,
    CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CREA VARCHAR(50) DEFAULT 'SYSTEM',
    MODIFICACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    MODIFICA VARCHAR(50) DEFAULT 'SYSTEM',
    CONSTRAINT ARCHIVO_FK_CARPETA FOREIGN KEY (ID_CARPETA) REFERENCES CARPETA(ID_CARPETA)
);

-- manejo de las solicitudes 

CREATE TABLE SOLICITUD_CAMBIO_ALMACENAMIENTO (     -- solicitud de cambio de paquete
	ID_SOLICITUD INT PRIMARY KEY AUTO_INCREMENT,  
	ID_USUARIO INT NOT NULL,                            
    ID_CUENTA INT NOT NULL,
    ID_PAQUETE INT NOT NULL,
    ESTADO_SOLICITUD INT NOT NULL,
    MODIFICACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    MODIFICA VARCHAR(50) DEFAULT 'SYSTEM',
    CONSTRAINT USUARIO_FK FOREIGN KEY (ID_USUARIO) REFERENCES USUARIO(ID_USUARIO),
    CONSTRAINT CUENTA_FK FOREIGN KEY (ID_CUENTA) REFERENCES CUENTA(ID_CUENTA),
    CONSTRAINT PAQUETE_FK FOREIGN KEY (ID_PAQUETE) REFERENCES PAQUETE(ID_PAQUETE)
);

CREATE TABLE SOLICITUD_ELIMINAR_CUENTA (           -- solicitud de eliminacion de cuenta
	ID_SOLICITUD INT PRIMARY KEY AUTO_INCREMENT,
    ID_USUARIO INT NOT NULL,
    ID_CUENTA INT NOT NULL,
    ESTADO_SOLICITUD INT NOT NULL,
    MODIFICACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    MODIFICA VARCHAR(50) DEFAULT 'SYSTEM'
);

CREATE TABLE SOLICITUD_ESTADO (                    -- estado de la solicitud --> pendiente, aprobada, rechazada
	ID_SOLICITUD INT PRIMARY KEY AUTO_INCREMENT,
	NOMBRE VARCHAR(50) NOT NULL
);