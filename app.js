// At the top of your Vue component or JS file

new Vue({
    // WARNING: I like to refer to myself in comments as numerous pronouns as it separates me from the code and helps my self esteem
    el: '#app',
    vuetify: new Vuetify(),
    data: function() {
        return {
            tabItems: ['direct', 'upload'],
            noteText: '', // RAW INPUT FROM USER
            formattedTextOutput: '', // OUTPUT AFTER FORMATTING
            selectedTab: 'direct',
            test: '',
            pdfFile: null,

            extractedText: '',
            extractionMethod: 'pdfjs'

            // ARRAY OF LINES FOR INTERNAL USE
        };
    },

    mounted() {
        // RUN AFTER VUE COMP IS IN DOMMY BOI
    },

    methods: {
        formatText() {
            let text = this.noteText || '';
            this.lines = text.split("\n"); // split by line breaks
            let formattedParts = [];
            let keywordsArray = [];

            this.lines.forEach((line) => {
                let trimmed = line.trim();
                if (!trimmed) {
                    formattedParts.push("<br>"); // blank line = paragraph break
                    return;
                }

                // Heuristic heading detection for PDFs
                if (/^[A-Z0-9\s]{4,}$/.test(trimmed)) { // uppercase lines = headings
                    formattedParts.push(`<h2>${trimmed}</h2>`);
                } else if (/^[-*•]\s/.test(trimmed)) { // bullet points
                    formattedParts.push(`<li>${trimmed.replace(/^[-*•]\s*/, "")}</li>`);
                } else {
                    formattedParts.push(`<p>${trimmed}</p>`); // normal paragraph
                }

                // Extract keywords
                let words = trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
                keywordsArray.push(...words);
            });

            // Wrap <li> in <ul> if needed
            let joined = formattedParts.join("\n");
            if (/<li>/.test(joined)) {
                joined = joined.replace(/(<li>.*?<\/li>)/gs, "<ul>\n$1\n</ul>");
            }

            this.formattedTextOutput = joined;


        },


        //BackSide Interaction Mapping: Read File ------> gets pages----->extract text ----> Display
        //DO NOT CHANGE IT MUST BE ASYNC AND AWAIT OR ELSE THE PAGE WILL FREEZE, .then could work but it looks weird 
        //Potenially using a server side pdf extraction libairy maybe via while also using java or Node.js could allow large files to work
        //ADD A SIZE limit because else it would be too much 
        //References for PDF Extraction :https://mozilla.github.io/pdf.js/examples/
        async pdfFileRead(file) {
            if (!file) return; //Does File Exist? 
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
              I will not be removing this
            */
            //furthur Loop Pdf text extraction reference https://community.palantir.com/t/parsing-pdf-blob-with-pdfjs-dist/1195,
            let extractedText = ""; //Do not edit or remove this line it stores the output text
            //Loop iteration for all the pages, Will not function without
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                // Concatenate all text items per page
                const pageText = textContent.items.map(item => item.str).join(" ").trim();
                extractedText += pageText + "\n\n"; // double line breaks for paragraphs
            }
            //save as raw
            this.noteText = extractedText;
            //CALL FORMATTER
            this.formatText();
            // this.formattedTextOutput = extractedText.replace(/\n/g, "<br>");

        },
        processFile() {
            if (!this.pdfFile) return;
            this.pdfFileRead(this.pdfFile); // regular PDF.js extraction
        },
        processFileImage() {
            this.tesseractPdfRead(this.pdfFile);
        },
        //Tesseract has the benefit of being about to read scanned pdfs and images and extract text/althought sometimes misrtreads images, It has more potenial and can describe scanned diagrams
        //For this reason I have given the user the ability to choose between teh two, as The tradeoffs between using Just Tesseract or just pdfjs did not balance out enough,
        async tesseractPdfRead() {
            if (!this.pdfFile) return;

            // Create a Tesseract.js worker
            const worker = createWorker({
                logger: m => console.log(m), // optional progress logging
            });

            await worker.load();
            await worker.loadLanguage('eng');
            await worker.initialize('eng');

            const arrayBuffer = await this.pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2 });

                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const context = canvas.getContext('2d');

                await page.render({ canvasContext: context, viewport }).promise;

                const { data: { text } } = await worker.recognize(canvas);
                fullText += text + '\n';
            }

            await worker.terminate();
            this.formattedTextOutput = fullText.replace(/\n/g, "<br>");
        }



    }
});