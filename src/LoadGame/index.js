import {pickerOpts} from "../Landing";
import cloneDeep from "lodash/cloneDeep";
import { initDesignBoard } from "../Game/initBoard";

const loadFile = async setGameData => {
    let fileHandle;
    // open file picker, destructure the one element returned array

    [fileHandle] = await window.showOpenFilePicker(pickerOpts);
    const fileData = await fileHandle.getFile();
    const jsonFile = await fileData.text();

    const data = cloneDeep(JSON.parse(jsonFile));

    setGameData(initDesignBoard(data));
}

export default loadFile;
