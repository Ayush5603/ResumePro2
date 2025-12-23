// ===== LOAD PDF.JS =====
const pdfScript = document.createElement("script");
pdfScript.src =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
document.head.appendChild(pdfScript);

// ===== EXTRACT PDF TEXT =====
async function extractTextFromPDF(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const pdfData = new Uint8Array(reader.result);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((it) => it.str).join(" ") + "\n";
        }
        resolve(text);
      } catch {
        resolve("");
      }
    };

    reader.readAsArrayBuffer(file);
  });
}

// ===== ATS BUTTON =====
document.querySelector(".ats-btn").addEventListener("click", async () => {
  const file = document.getElementById("resumeFile").files[0];
  if (!file) {
    alert("Upload resume PDF");
    return;
  }

  const resumeText = await extractTextFromPDF(file);
  if (!resumeText || resumeText.length < 100) {
    alert("Could not read resume text");
    return;
  }

  let response;
  try {
    response = await fetch(`${window.location.origin}/api/ats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText })
    });
  } catch {
    alert("Network error");
    return;
  }

  if (!response.ok) {
    alert("ATS server error");
    return;
  }

  const data = await response.json();

  // ===== UI UPDATE =====
  const scoreBox = document.querySelector(".score");
  const list = document.querySelector(".suggestion-list");

  scoreBox.textContent = data.ats_score ?? 0;
  scoreBox.style.color =
    data.ats_score >= 90 ? "green" :
    data.ats_score >= 70 ? "orange" : "red";

  list.innerHTML = "";
  if (Array.isArray(data.suggestions) && data.suggestions.length) {
    data.suggestions.forEach(s => {
      const li = document.createElement("li");
      li.textContent = s;
      list.appendChild(li);
    });
  } else {
    list.innerHTML = "<li>No suggestions</li>";
  }
});
