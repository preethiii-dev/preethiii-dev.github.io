const codeInput = document.getElementById("codeInput");
const explainBtn = document.getElementById("explainBtn");
const result = document.getElementById("result");
const charCount = document.getElementById("charCount");
const copyBtn = document.getElementById("copyBtn");

// Character Counter
codeInput.addEventListener("input", () => {
    charCount.innerText = `${codeInput.value.length} Characters`;
});

// Explain Button
explainBtn.addEventListener("click", () => {

    const code = codeInput.value.trim();

    if (code === "") {
        result.innerHTML = "⚠️ Please paste some code first!";
        return;
    }

    result.innerHTML = "⏳ Thinking...";

    setTimeout(() => {
        result.innerHTML = generateExplanation(code);
    }, 800);

});

// Copy Button
copyBtn.addEventListener("click", () => {

    navigator.clipboard.writeText(result.innerText);

    copyBtn.innerHTML = "✅ Copied";

    setTimeout(() => {
        copyBtn.innerHTML = "📋 Copy";
    }, 2000);

});

// Quick Examples
function loadExample(type){

    let code = "";

    switch(type){

        case "hello":
            code = `console.log("Hello World");`;
            break;

        case "bubble":
            code = `function bubbleSort(arr){
    for(let i=0;i<arr.length;i++){
        for(let j=0;j<arr.length-i-1;j++){
            if(arr[j]>arr[j+1]){
                let temp=arr[j];
                arr[j]=arr[j+1];
                arr[j+1]=temp;
            }
        }
    }
    return arr;
}`;
            break;

        case "binary":
            code = `function binarySearch(arr,target){
    let left=0;
    let right=arr.length-1;

    while(left<=right){
        let mid=Math.floor((left+right)/2);

        if(arr[mid]===target){
            return mid;
        }

        if(arr[mid]<target){
            left=mid+1;
        }else{
            right=mid-1;
        }
    }

    return -1;
}`;
            break;

        case "linkedlist":
            code = `class Node{
    constructor(data){
        this.data=data;
        this.next=null;
    }
}`;
            break;

        case "factorial":
            code = `function factorial(n){
    if(n===0 || n===1){
        return 1;
    }

    return n*factorial(n-1);
}`;
            break;
    }

    codeInput.value = code;
    charCount.innerText = `${code.length} Characters`;

    result.innerHTML = generateExplanation(code);
}

// AI Explanation
function generateExplanation(code){

    // Quick Examples

    if(code.includes('console.log("Hello World")')){
        return `
        <b>🌍 Hello World</b><br><br>

        This program prints <b>"Hello World"</b> to the console.

        <br><br>

        <b>Purpose:</b> It is usually the first program beginners write to verify that their programming environment works correctly.
        `;
    }

    if(code.includes("bubbleSort")){
        return `
        <b>🔄 Bubble Sort</b><br><br>

        Bubble Sort repeatedly compares adjacent elements and swaps them if they are in the wrong order.

        <br><br>

        <b>Time Complexity:</b> O(n²)

        <br>

        <b>Space Complexity:</b> O(1)
        `;
    }

    if(code.includes("binarySearch")){
        return `
        <b>🔍 Binary Search</b><br><br>

        Binary Search finds an element in a sorted array by repeatedly dividing the search range in half.

        <br><br>

        <b>Time Complexity:</b> O(log n)
        `;
    }

    if(code.includes("class Node")){
        return `
        <b>🔗 Linked List Node</b><br><br>

        This class represents one node in a Linked List.

        Each node stores data and a reference to the next node.
        `;
    }

    if(code.includes("factorial")){
        return `
        <b>🧮 Factorial using Recursion</b><br><br>

        This function calculates the factorial of a number recursively.

        <br><br>

        Example:<br>

        5! = 5 × 4 × 3 × 2 × 1 = 120
        `;
    }

    // Keyword Detection

    if(code.includes("function")){
        return `
        <b>📌 Function Detected</b><br><br>

        A function is a reusable block of code that performs a specific task.
        `;
    }

    if(code.includes("for")){
        return `
        <b>🔁 For Loop Detected</b><br><br>

        A for loop repeats a block of code until a condition becomes false.
        `;
    }

    if(code.includes("while")){
        return `
        <b>🔄 While Loop Detected</b><br><br>

        A while loop keeps running while its condition is true.
        `;
    }

    if(code.includes("if")){
        return `
        <b>⚖️ If Statement Detected</b><br><br>

        Executes code only when the specified condition is true.
        `;
    }

    if(code.includes("else")){
        return `
        <b>➡️ Else Statement Detected</b><br><br>

        Runs when the if condition is false.
        `;
    }

    if(code.includes("class")){
        return `
        <b>🏛️ Class Detected</b><br><br>

        A class is a blueprint used to create objects.
        `;
    }

    if(code.includes("return")){
        return `
        <b>↩️ Return Statement</b><br><br>

        The return statement sends a value back from a function.
        `;
    }

    if(code.includes("console.log")){
        return `
        <b>🖥️ Console Output</b><br><br>

        console.log() prints output to the browser console.
        `;
    }

    if(code.includes("let")){
        return `
        <b>📦 let Keyword</b><br><br>

        let declares a variable whose value can be changed.
        `;
    }

    if(code.includes("const")){
        return `
        <b>🔒 const Keyword</b><br><br>

        const declares a variable that cannot be reassigned.
        `;
    }

    if(code.includes("fetch")){
        return `
        <b>🌐 Fetch API</b><br><br>

        fetch() is used to request data from an API or server.
        `;
    }

    if(code.includes("addEventListener")){
        return `
        <b>🖱️ Event Listener</b><br><br>

        Waits for user interactions such as clicks or typing.
        `;
    }

    if(code.includes("document.getElementById")){
        return `
        <b>📄 DOM Selection</b><br><br>

        document.getElementById() selects an HTML element using its ID.
        `;
    }

    return `
    <b>✅ Code received successfully</b><br><br>

    Your code was analyzed.

    AI-powered explanations with detailed line-by-line analysis will be available after API integration.
    `;
}
