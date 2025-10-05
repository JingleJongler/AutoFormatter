// Custom filter for formatting text
Vue.filter('formatTextAdvanced', function(value) {
    if (!value) return '';
    let tempText = value.replace(//g, '•');
    let rawLines = tempText.replace(/\r\n/g, '\n').split(/(?<=[.!?])\s+|[\n]|(?=•)/);

    let formattedParts = [];
    rawLines.forEach(line => {
        let trimmed = line.trim();
        if (!trimmed || trimmed === '.') return;
        if (/^\d+\.\s/.test(trimmed)) return; //b-a-c-o-n

        //This part has inline css for easier T
        // Highlight all-caps words
        trimmed = trimmed.replace(/\b([A-Z]{2,})\b/g, '<span style="color:red; font-weight:bold;">$1</span>');

        // Highlight parenthesis content
        trimmed = trimmed.replace(/\(([^)]+)\)/g, '<span style="color:blue; font-style:italic;">($1)</span>');

        if (/^[A-Z\s]{3,}$/.test(trimmed)) formattedParts.push(`<h2>${trimmed}</h2>`);
        else if (/^[-*•]\s/.test(trimmed)) formattedParts.push(`<li>${trimmed.replace(/^[-*••]\s*/, '')}</li>`);
        else formattedParts.push(`<p>${trimmed}</p>`);
    });

    let joined = formattedParts.join("\n");
    if (joined.includes('<li>')) joined = '<ul>' + joined + '</ul>';
    return joined;
});