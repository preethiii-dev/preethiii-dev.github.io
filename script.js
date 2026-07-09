const codeInput = document.getElementById("codeInput");
const explainBtn = document.getElementById("explainBtn");
const result = document.getElementById("result");
const charCount = document.getElementById("charCount");
const copyBtn = document.getElementById("copyBtn");


// Character counter
codeInput.addEventListener("input", () => {
    charCount.innerText = `${codeInput.value.length} Characters`;
});


// Explain button
explainBtn.addEventListener("click", () => {

    const code = codeInput.value.trim();

    if (code === "") {
        result.innerHTML = "⚠️ Please paste some code first!";
        return;
    }


    result.innerHTML = "⏳ Thinking...";


    setTimeout(() => {

        result.innerHTML = generateExplanation(code);

    }, 1000);

});


// Copy button
copyBtn.addEventListener("click", () => {

    navigator.clipboard.writeText(result.innerText);

    copyBtn.innerHTML = "✅ Copied";

    setTimeout(() => {
        copyBtn.innerHTML = "📋 Copy";
    }, 2000);

});


// Temporary explanation system
function generateExplanation(code){

    if(code.includes("function")){

        return `
        <b>Function detected:</b><br>
        This code creates a function.
        Functions are reusable blocks of code used to perform tasks.
        `;

    }


    if(code.includes("for")){

        return `
        <b>Loop detected:</b><br>
        This code uses a for loop to repeat instructions multiple times.
        `;

    }


    if(code.includes("if")){

        return `
        <b>Conditional statement detected:</b><br>
        This code checks a condition and executes code based on true/false.
        `;

    }


    return `
    <b>Code received successfully ✅</b><br><br>
    I can see your code, but advanced AI explanation will be added when API integration is connected.
    `;
}