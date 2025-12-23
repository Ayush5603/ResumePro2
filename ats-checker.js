// ================= LOAD PDF.JS =================
const pdfScript = document.createElement("script");
pdfScript.src =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
pdfScript.onload = () => console.log("PDF.js loaded");
document.head.appendChild(pdfScript);

// ================= PDF TEXT EXTRACTION =================
async function extractTextFromPDF(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        if (!window.pdfjsLib) {
          console.error("pdfjsLib not loaded");
          resolve("");
          return;
        }

        const pdfData = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items.map(item => item.str).join(" ");
          fullText += pageText + "\n";
        }

        resolve(fullText);
      } catch (err) {
        console.error("PDF extraction error:", err);
        resolve("");
      }
    };

    reader.readAsArrayBuffer(file);
  });
}

// ================= ATS BUTTON HANDLER =================
document.querySelector(".ats-btn").addEventListener("click", async () => {
  console.log("BTN CLICKED!");

  const fileInput = document.getElementById("resumeFile");
  const file = fileInput?.files?.[0];

  if (!file) {
    alert("Please upload a resume PDF.");
    return;
  }

  console.log("Extracting PDF text...");
  const resumeText = await extractTextFromPDF(file);

  console.log("Extracted preview:", resumeText.slice(0, 200));

  if (!resumeText || resumeText.trim().length < 100) {
    alert("Resume text unreadable or too short.");
    return;
  }

  console.log("Calling Cloudflare ATS API...");

  let response;
  try {
    response = await fetch("/api/ats", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ resumeText })
    });
  } catch (err) {
    console.error("NETWORK ERROR:", err);
    alert("Network error while calling ATS API.");
    return;
  }

  console.log("RAW RESPONSE STATUS:", response.status);

  if (!response.ok) {
    const errText = await response.text();
    console.error("API ERROR:", response.status, errText);
    alert("ATS server error");
    return;
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    console.error("JSON PARSE ERROR:", err);
    alert("Invalid ATS response");
    return;
  }

  console.log("ATS RESULT:", data);

  // ================= UI UPDATE =================
  const scoreBox = document.querySelector(".score");
  const suggestionList = document.querySelector(".suggestion-list");

  scoreBox.textContent = data.ats_score ?? 0;

  if (data.ats_score >= 90) scoreBox.style.color = "green";
  else if (data.ats_score >= 70) scoreBox.style.color = "orange";
  else scoreBox.style.color = "red";

  suggestionList.innerHTML = "";

  if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
    data.suggestions.forEach(s => {
      const li = document.createElement("li");
      li.textContent = s;
      suggestionList.appendChild(li);
    });
  } else {
    suggestionList.innerHTML =
      "<li>No suggestions returned.</li>";
  }
});
