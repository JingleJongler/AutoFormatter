// tesseract.js
import { formatText, pageSplit, generateKeywords, pdfFileRead } from './textProcessing.js';
import { checkFileType, } from './fileHandler.js';

//Loading bar and the create Worker
//if you look at the console while it is doing an image it will show stuff like { "status": "loading tesseract core", "progress": 0.2 }
//  state is because we are trying to make 
//Progression: 
// User click Diagram.png ---->calls onto tesseractImageFile() 
//Vue shows the progress bar via LOADING=TRUE!!!!!
//Tessa runs OCR on the image/s and sends Progress updates to the logger,
//Vue then updates the progressValue making the progress bar move
//FINAL output occurs when OCR completes triggering output block and turning loading to OFF, and resets progress,
export async function initTesseract(state) {
    // Tesseract.createWorker() creates a web worker running Tessa OCR engine in background(think web worker as a background thread that stops the UI from freezing till finished, Which runs code of thee main thread so page is still responsive,)
    state.tesseractWorker = Tesseract.createWorker({ //state is RUNNING THE worker independently so tessa can process images without freezing UI
        logger: m => { //COMMUNICATION BETWEEN MAIN THREAD AND WORKER IS DONE VIA MESSAGES
            if (m.status === 'recognizing text') {
                state.loading = true;

                // Use state consistently, not store
                const currentPageIndex = state.currentPageIndex || 0;

                // Safe totalPages check
                let totalPages = 1;
                if (state.pages && state.pages.length > 0) {
                    totalPages = state.pages.length;
                }

                // Map Tesseract progress to cumulative progress across pages
                const pageProgress = m.progress / totalPages;
                const cumulativeProgress = ((currentPageIndex / totalPages) + pageProgress) * 100;

                // Clamp 0–100
                state.progressValue = Math.min(Math.max(Math.floor(cumulativeProgress), 0), 100);
            }
        }
    });
    await state.tesseractWorker.load(); // Load Tesseract core
    await state.tesseractWorker.loadLanguage('eng'); // Load eng 
    await state.tesseractWorker.initialize('eng'); // Initialize the OCR engine
}

//Tesseract has the benefit of being able to read scanned PDFs and images and extract text/although sometimes misreads images, It has more potential and can describe scanned diagrams
//For state reason I have given the user the ability to choose between THE two, as The tradeoffs between using Just Tesseract or just PDF.js did not balance out enough,
//MAIN RESOURCE https://tesseract.projectnaptha.com/
export async function tesseractPdfRead(state) {
    if (!state.pdfFile) return;
    // Create a Tesseract.js worker for the OCR and load the Tesseract core library 
    //Convert into an ArrayBuffer (THE BINARY FORMAT) then return pdf as a pdf object
    const arrayBuffer = await state.pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    //Loop each page in pdf and set zoom level to 2x

    for (let i = 0; i < pdf.numPages; i++) {
        state.currentPageIndex = i;
        const page = await pdf.getPage(i + 1); // PDF.js pages are 1-based
        const viewport = page.getViewport({ scale: 2 });
        //Below shows the canvas the content is rendered into, AKA PICTURE SCREEN FOR THE TESSERACT TO READ
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport }).promise;
        //below is the passing arguments to the Tesseract for OCR, and then extract texts from the page and appends it to the fullText
        const { data: { text } } = await state.tesseractWorker.recognize(canvas);
        fullText += text + '\n';
        //ISSUE
        if (pdf.numPages > 1) {
            state.showAlert = true;
            state.alertMessage = `Warning: ${pdf.numPages} pages detected. Please be patient, As the progress bar may be faster then it takes to export to the Output Box.`;

        } else {
            state.showAlert = false;
            state.alertMessage = '';
        }


    }
    state.noteText = fullText;
    pageSplit(state, fullText);
    generateKeywords(state);
    //await worker.terminate(); //Terminate worker to free memory
}

export async function tesseractImageFile(state) {
    if (!state.pdfFile) return;
    //I lost consciousness around state part
    try {
        state.loading = true;
        state.isProcessing = true;
        // Convert File to Data URL
        const reader = new FileReader(); //remember state is using the BUILT-IN-BROWSER API on the client side YOU DO NOT HAVE TO RELINK IT IS ALREADY INSIDE
        const dataURL = await new Promise((resolve, reject) => { //Remember that promises are used to wrap all the binglebangles which allow await to use, IT IS WHY THERE ARE SYNCHS IN THE CRoNUSSY!
            reader.onload = e => resolve(e.target.result); //ON Successful read , onload event fire , and resolve tells promise WE HAVE COMPLETED THE MISSION, here is a result
            reader.onerror = err => reject(err); //on FAILED read, one error Event Fire, aka the await throws an error which is caught in try-catch Think law-n-order
            reader.readAsDataURL(state.pdfFile); //BASE62 STRING NOT 32
        });
        // Run OCR using the existing worker
        const { data: { text } } = await state.tesseractWorker.recognize(dataURL, 'eng');
        // Save raw text to noteText
        state.noteText = text;
        // Format text
        pageSplit(state, state.noteText);
        generateKeywords(state);
    } catch (error) {
        state.showAlert = true;
        state.alertMessage = "Failed OCR extraction: " + error.message;
    } finally { //Progress bar reset and finalization 
        state.loading = false;
        state.progressValue = 0;
        state.isProcessing = false;
    }
    //I have opted to not terminate after As there is a weird error in which you cannot reload any instances,
}
export async function processFile(state) {
    // if (state.loading) return; // ignore extra clicks 50 percent of time
    state.loading = true;
    state.progressValue = 0; //rUN NO FILE SELECT HELPER FUNC
    //MAYBE REMOVE DELETE 
    //although hypothetically possible to trigger likelihood is very unlikely
    if (!state.pdfFile) return;
    const fileName = state.pdfFile.name.toLowerCase();
    if (fileName.endsWith('.pdf')) {
        console.log("PDF file detected, processing with PDF.js");
        await pdfFileRead(state, state.pdfFile); // regular PDF.js extraction
    } else {
        await processFileImage(state); //call other
    }
    state.showAlert = false;
    state.alertMessage = "";
}

//Runs image processing and the tesseract button
export async function processFileImage(state) {
    if (!state.pdfFile) {
        noFileSelected(state);
    }
    state.showAlert = false;
    state.alertMessage = "";
    const fileName = state.pdfFile.name.toLowerCase();
    if (fileName.endsWith('.pdf')) {
        await tesseractPdfRead(state); // existing PDF + Tesseract flow aka the image ocr
    } else if (fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
        await tesseractImageFile(state); // image-based extraction
    }
    //is it a txt?
    else if (fileName.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            state.noteText = e.target.result;
            formatText(state);
        };
        reader.readAsText(state.pdfFile); // now works
    } else {
        state.showAlert = true;
        console.warn("Unsupported file type:", fileName);
        await checkFileType(state);
    }
}