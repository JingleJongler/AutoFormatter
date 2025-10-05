import { initTesseract, tesseractPdfRead, processFileImage, processFile } from './Tesseract.js';
import { loadFilesFromGithub, fetchExternalFile, resetAfterError, noFileSelected, checkFileType } from './fileHandler.js';
import { formatText, pageSplit, generateKeywords, nextPage, prevPage } from './textProcessing.js';
import { FileList } from './components/fileList.js';
const Vue = window.Vue;
const Vuetify = window.Vuetify;

Vue.component('file-list', FileList);
new Vue({
    el: '#app',
    vuetify: new Vuetify(),
    data() {
        return {
            tabItems: ['direct', 'upload'],
            noteText: '', // RAW INPUT FROM USER
            formattedTextOutput: '', // OUTPUT AFTER FORMATTING
            selectedTab: 'direct',
            sampleFiles: [], // sampleFiles: ["bee.txt", "Diagram.png", "Number.png"], //These are the best ones in there, Numbers is weird  BUT VITAL IN SHOWING THE OCR interpreting  IT CONTEXTUALLY AND there is some preprocessing issues but its clear the computer won 
            pdfFile: null, //Decided to store as one val as it matches my aesthetics
            extractedText: '',
            tesseractWorker: null, // Reusable Tesseract worker for OCR
            keywords: [],
            showFiles: false,

            //Alert Data
            showAlert: false,
            alertMessage: "",
            //Loading Related data
            loading: false, //Added a loading var as sometimes it takes a while with the OCR will DeFault be true when any async runs
            progressValue: 0,
            isProcessing: false,
            //Paginated Outcome pages 
            pages: [],

            currentPageIndex: 0

        };
    },

    async mounted() {
        await initTesseract(this);
        await loadFilesFromGithub(this); //Fetch Files from github
    },
    computed: {
        currentPage() {
            return this.pages[this.currentPageIndex] || '';
        },
    },


    methods: {
        // Navigation
        nextPage() { nextPage(this); },
        prevPage() { prevPage(this); },

        // Text processing
        formatText() { formatText(this); },
        pageSplit(rawText) { pageSplit(this, rawText); },
        generateKeywords() { generateKeywords(this); },

        // Tesseract
        initTesseract() { return initTesseract(this); },
        tesseractPdfRead() { return tesseractPdfRead(this); },
        processFileImage() { return processFileImage(this); },
        processFile() { return processFile(this); },

        // File handling
        async fetchExternalFile(file) {
            await fetchExternalFile(this, file);
        },

        loadFilesFromGithub() { return loadFilesFromGithub(this); },
        fetchExternalFile(file) { return fetchExternalFile(this, file); },
        noFileSelected() { return noFileSelected(this); },
        checkFileType() { return checkFileType(this); },

        // Utilities
        resetAfterError() { resetAfterError(this); },

    },
});