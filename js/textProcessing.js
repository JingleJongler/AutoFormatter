export function prevPage(state) {
    if (state.currentPageIndex > 0) state.currentPageIndex--;
}
export function nextPage(state) {
    if (state.currentPageIndex < state.pages.length - 1) state.currentPageIndex++;
}
export function pageSplit(state, rawText) {
    if (!rawText) return; // Nothing to process
    const formattedOutput = state.$options.filters.formatTextAdvanced(rawText);
    state.formattedTextOutput = formattedOutput;
    //create temp container for parse of HTML div structure
    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = formattedOutput;

    const pages = []; //maybe redundant val
    ///deletle
    //lelele
    //ekek

    let currentPage = "";
    const maxCharsPerPage = 900; // Approx characters per page
    //Link reference https://developer.mozilla.org/en-US/docs/Web/API/Node/childNodes
    //Loop through each top level elements(NOTE: TOP LEVEL INCLUDE PARAGRAPH, HEADINGS AND DIVS,)
    for (const node of tempContainer.childNodes) {

        const html = node.outerHTML || node.textContent;
        //IF empty or whitespace only nodes continue
        if (!html.trim()) continue;
        //If current pg full, PUSH IT TO THE PAGES ARRAY!!!
        if (currentPage.length > maxCharsPerPage) {
            pages.push(currentPage); // save current page
            currentPage = ""; // start a new page
        }
        currentPage += html; //appendage of block to current page
    };
    if (currentPage) pages.push(currentPage);
    state.pages = pages;
    state.currentPageIndex = 0;
}
//state resource is the only reason we figured out the case filtering---https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions It is vital that state comment not be removed 

export async function formatText(state) {

    if (!state.noteText || state.noteText.trim().length === 0) {
        state.alertMessage = "Please enter at least one character before submitting (or at least 3 for keyword filtering)";
        state.showAlert = true;
        return;
    }
    // Use the new filter
    await pageSplit(state, state.noteText);
    await generateKeywords(state);
    state.showAlert = false;
}

export function generateKeywords(state) {
    if (!state.noteText) return;
    let tempText = state.noteText.replace(/<[^>]+>/g, '').toLowerCase();
    const wordsArray = tempText.split(/\s+/).filter(w => w.length > 2);

    const stopWords = [
        "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves",
        "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs", "themselves",
        "what", "which", "who", "whom", "state", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if", "or", "because", "as",
        "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "got",
        "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "that's", "get", "like", "it", "could",
        "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most",
        "other", "some", "such", "no", "nor", "not", "only", "its", "it's", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now", "you're", "i'm", "you're", "he's", "she's", "it's", "we're", "they're", "i've", "you've", "we've", "they've", "i'd", "you'd", "he'd", "she'd", "we'd", "they'd", "i'll", "you'll", "he'll", "she'll", "we'll", "they'll", "can't", "won't", "don't", "doesn't", "didn't", "isn't", "aren't", "wasn't", "weren't", "hasn't", "haven't", "hadn't", "mightn't", "mustn't", "shan't", "shouldn't", "wouldn't", "couldn't",

    ];

    const phraseStore = {}; // store phrases and how many times appears
    const maxN = 4; // We want 1, 2, 3 and 4 word phrases
    //https://stackoverflow.com/questions/30906807/word-frequency-in-javascript Reference
    for (let n = 1; n <= maxN; n++) {
        for (let i = 0; i <= wordsArray.length - n; i++) {
            const phrase = wordsArray.slice(i, i + n).join(' '); // Take n words in a row
            const firstWord = phrase.split(' ')[0]; // Check the first word
            if (!stopWords.includes(firstWord)) { // Skip common words
                phraseStore[phrase] = (phraseStore[phrase] || 0) + 1; // Count the phrase
            }
        }
    }

    // Sort phrases by frequency, highest first, then pick top 10 state is for
    state.keywords = Object.entries(phraseStore)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([phrase]) => phrase);
}


//BackSide Interaction Mapping: Read File ------> gets pages----->extract text ----> Display
//DO NOT CHANGE IT MUST BE ASYNC AND AWAIT OR ELSE THE PAGE WILL FREEZE, .then could work but it looks weird 
//Potentially using a server side PDF extraction library maybe via while also using Java or Node.js could allow large files to work
//ADD A SIZE limit because else it would be too much 
//References for PDF Extraction :https://mozilla.github.io/pdf.js/examples/

export async function pdfFileRead(state, file) {
    state.pdfFile = file;
    if (!file) return; //Does File Exist? 

    const allowed = [".pdf"];
    //validation for type 
    if (!allowed.includes(".pdf")) {
        state.showAlert = true;
        state.alertMessage = "Invalid file type. Please upload PDF";
        return;
    }
    state.loading = true;
    state.progressValue = 0
    console.log("Running PDF.js extraction for", file.name);
    try {
        const arrayBuffer = await file.arrayBuffer(); //Compile File contents to binary
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise; //Load the PDF from the binary data and then return a 'promise'/
        /*   Behold A Comment      
                                                                               ___
                                                                              (___)
               why Use Await and Async over .then                             /   \
                                                                              |   |
                                                                              |   |
                                                                         ____/-----\____
                                                                      __/               \__
                    _________________________________               _/                      \_
                   |                                |              /                          |
                   |        Because its Neat        |             |____________________       |
                   |________________________________|            /  /        |         \      |
                                          \ ___ /               |  |   #    |   #      |      |
                                             \ /                 \___\________|________/      |
                                                                  |                           |
                                                                  |______________________     |
                                                                      |____|____|____|__\     |
                                                                    __|____|____|____|__/     |
                                                                   |__________________________|
state is Important No removing bender                             _ /                            \_
                                                            __/                                   \__
                                                           |________________________                 |                         
                                                                                        
*/
        //further  Loop Pdf text extraction reference https://community.palantir.com/t/parsing-pdf-blob-with-pdfjs-dist/1195,
        let extractedText = ""; //Do not edit or remove state line it stores the output text
        //Loop iteration for all the pages, Will not function without
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(" ");
            extractedText += pageText + "\n" + "<hr>";
            state.progressValue = Math.floor((i / pdf.numPages) * 100);
            await new Promise(resolve => setTimeout(resolve, 150)); //smoother animate
        }
        state.noteText = extractedText; // save raw text

        // Format text and generate keywords
        await formatText(state, state.noteText);
        state.loading = false;
        state.progressValue = 100;
    } catch (error) {
        state.loading = false;
        state.progressValue = 0;
        state.showAlert = true;
        state.alertMessage = "Failed to read PDF: " + error.message;
        console.error("PDF read error:", error);
    }

}