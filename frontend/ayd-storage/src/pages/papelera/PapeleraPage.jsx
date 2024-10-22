import React, {useEffect, useState} from "react";
import FileBrowser from "../../components/FileBrowser/FileBrowser";
import FloatingActionButtons from "../../components/iconsFav/floatingActionButtons";

const PapeleraPage = () => {


    return (
        <div>
            <FileBrowser esPapelera={true} esFavoritos={false} />
            <FloatingActionButtons />
        </div>
    )
}

export default PapeleraPage;