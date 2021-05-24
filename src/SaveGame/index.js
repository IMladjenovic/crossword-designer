import {pickerOpts} from "../Landing";

export const saveGame = async data => {
    const jsonSave = JSON.stringify(data);

    // create a new handle
    const newHandle = await window.showSaveFilePicker(pickerOpts);

    // create a FileSystemWritableFileStream to write to
    const writableStream = await newHandle.createWritable();

    // write our file
    const blob = new Blob([jsonSave], {type : 'application/json'});
    await writableStream.write(blob);

    // close the file and write the contents to disk.
    await writableStream.close();
}

export const saveAndLeave = async (data, leaveGame) => {
    try {
        await saveGame(data);
        await leaveGame();
    } catch (e) {
        alert(e);
    }
}
