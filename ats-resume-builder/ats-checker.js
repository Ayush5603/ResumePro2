// -------- Load PDF.js FIRST -------- //
const pdfScript = document.createElement("script");
pdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
pdfScript.onload = () => console.log("PDF.js loaded");
document.head.appendChild(pdfScript);



// -------- Extract text from PDF -------- //
async function extractTextFromPDF(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = async () => {
            try {
                const pdfData = new Uint8Array(reader.result);

                const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

                let textContent = "";

                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                    const page = await pdf.getPage(pageNum);
                    const content = await page.getTextContent();
                    const pageText = content.items.map((item) => item.str).join(" ");
                    textContent += pageText + "\n";
                }

                resolve(textContent);
            } catch (err) {
                console.error("PDF Extraction Error:", err);
                resolve(""); // return empty to avoid crashes
            }
        };

        reader.readAsArrayBuffer(file);
    });
}



// -------- Handle ATS Button Click -------- //
document.querySelector(".ats-btn").addEventListener("click", async () => {
    console.log("BTN CLICKED!");

    const file = document.getElementById("resumeFile").files[0];
    if (!file) {
        alert("Please upload a resume PDF.");
        return;
    }

    console.log("Extracting PDF text...");
    const resumeText = await extractTextFromPDF(file);

    console.log("Extracted Text:", resumeText.substring(0, 200));

    if (!resumeText.trim()) {
        alert("Could not read text from PDF.");
        return;
    }

    console.log("Calling Netlify Function...");

    let response;
    try {
        response = await fetch("/.netlify/functions/ats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resumeText })
        });
    } catch (err) {
        console.error("NETWORK ERROR:", err);
        alert("Network error calling function.");
        return;
    }

    console.log("Function RAW RESPONSE:", response);

    let data;
    try {
        data = await response.json();
    } catch (err) {
        console.error("JSON PARSE ERROR:", err);
        alert("Invalid response from server.");
        return;
    }

    console.log("Function Parsed Data:", data);

    // ---- UI UPDATE ---- //
    const scoreBox = document.querySelector(".score");
    scoreBox.textContent = data.ats_score || 0;

    if (data.ats_score >= 90) scoreBox.style.color = "green";
    else if (data.ats_score >= 70) scoreBox.style.color = "orange";
    else scoreBox.style.color = "red";

    const suggestionList = document.querySelector(".suggestion-list");
    suggestionList.innerHTML = "";

    if (data.suggestions?.length > 0) {
        data.suggestions.forEach(s => {
            suggestionList.innerHTML += `<li>${s}</li>`;
        });
    } else {
        suggestionList.innerHTML = "<li>No suggestions returned.</li>";
    }
});

