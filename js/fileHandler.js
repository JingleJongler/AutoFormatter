// fileHandler.js
import { formatText, } from './textProcessing.js';

import { processFileImage, tesseractPdfRead, processFile } from './tesseract.js';


export async function loadFilesFromGithub(context) {
    try {
        // Fetch the JSON with cache-busting  
        const response = await fetch("https://api.github.com/repos/JingleJongler/AutoFormatter/contents/External-Data");
        //  const response = await fetch("https://api.github.com/repos/JingleJongler/External-Data/contents");
        if (!response.ok) throw new Error("Failed to fetch external files");
        //const response = await fetch("https://jinglejongler.github.io/External-Data/files.json?t=" + new Date().getTime());
        const data = await response.json();
        const allowedTypes = [".png", ".jpg", ".jpeg", ".pdf", ".txt"];
        // Extract just the names with existing fetchExternalFile
        context.sampleFiles = data
            .filter(file => allowedTypes.some(ext => file.name.toLowerCase().endsWith(ext)))
            .map(file => ({
                name: file.name,
                url: file.download_url //file.url
            }));
        console.log("Loaded files:", context.sampleFiles);


    } catch (err) {
        console.error("Error fetching file list:", err);
        context.showAlert = true;
        context.alertMessage = "Failed to load external files.";
    }
}
export async function fetchExternalFile(state, file) {
    if (state.loading) return; // ignore clicks while processing      
    resetAfterError(state); // Reset output AND ALERTS
    state.loading = true; // show loading bar
    state.progressValue = 0;

    try {

        //   const baseUrl = "https://jinglejongler.github.io/External-Data/"; //this is the globalized container i have setup in my profile Github, It is public for testing purposes
        const response = await fetch(file.url); //Appends the filename by requesting the file name stored inside of the array sampleFiles
        const extension = file.name.split('.').pop().toLowerCase(); //extract file extension and convert total to lowercase to allow for multiple file type handling
        if (!response.ok) throw new Error("Network response was not ok"); //this is for if a 404 error happens

        if (["png", "jpg", "jpeg"].includes(extension)) {
            const blob = await response.blob(); //Blob has been chosen due to working with raw binary data Here it converts the response into a blob for Js to handle it in memory
            const imageFile = new File([blob], file.name, { type: blob.type }); //Wrap Blob as a file for teh OCR function to accept as an uploaded file
            // I have done this because, unlike text, images can't be read directly as they are binary. See the Number example, which contains binary on top of binary.
            // The Blob allows me to store and manipulate it so that binary data is put in memory before being passed to other functions.
            state.pdfFile = imageFile;
            await processFileImage(state, blob); // OCR extraction
            state.showAlert = false;

        } // Handle PDF files
        else if (extension === "pdf") {
            const blob = await response.blob();
            const pdfFile = new File([blob], file.name, { type: blob.type });
            state.pdfFile = pdfFile;
            await tesseractPdfRead(state, state.pdfFile);
            state.showAlert = false;
        } else if (extension === "txt") {
            const data = await response.text(); //read fetched as text
            state.noteText = data;
            await formatText(state); // make sure formatting finishes
            state.showAlert = false; //hide any pre alert messages as run has been successful
            //Image based handling instances
        } else {
            state.showAlert = true;
            state.alertMessage = "Unsupported file type: " + extension;
        }
        //Error Dungeons
    } catch (error) {
        state.showAlert = true;
        state.alertMessage = "Failed to load external file: " + error.message;
    } finally {
        state.loading = false; // hide loading bar
    }

}
//Currently
export function noFileSelected(context) {
    context.showAlert = true;
    context.alertMessage = "No file selected.";
    console.log("No file selected Error")
    return;
}

export function checkFileType(context) {
    const allowedTypes = [".png", ".jpg", ".jpeg", ".pdf", ".txt"]; //maybe add GIF
    if (!allowedTypes.includes(context.pdfFile.type)) {
        context.showAlert = true;
        context.alertMessage = "Invalid file selected. Please upload PDF,JPG, JPEG, PNG, or TXT.";
        return;
    }
}
export function resetAfterError(state) {
    state.showAlert = false;
    state.alertMessage = "";
    state.pdfFile = null;
    state.noteText = "";
    state.pages = [];
    state.formattedTextOutput = "";
    state.keywords = [];
}