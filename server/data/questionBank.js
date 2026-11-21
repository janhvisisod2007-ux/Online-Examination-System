const S = (text, options, answer, explanation = "") => ({
  text, type: "single", options, correctAnswers: [answer], explanation,
});
const M = (text, options, answers, explanation = "") => ({
  text, type: "multiple", options, correctAnswers: answers, explanation,
});
const TF = (text, answer, explanation = "") => ({
  text, type: "truefalse", options: ["True", "False"], correctAnswers: [answer ? 0 : 1], explanation,
});

const questionBank = {
  JavaScript: [
    S("Which keyword declares a block-scoped variable that can be reassigned?", ["var", "let", "const", "static"], 1, "let is block-scoped and can be reassigned."),
    S("What does typeof null return?", ["\"null\"", "\"undefined\"", "\"object\"", "\"number\""], 2, "It is a long-standing quirk of JavaScript."),
    S("Which method adds an element to the end of an array?", ["push()", "pop()", "shift()", "unshift()"], 0),
    S("What is the result of '5' + 3?", ["8", "\"53\"", "NaN", "Error"], 1, "The + operator concatenates when one operand is a string."),
    S("Which of these is NOT a primitive type in JavaScript?", ["string", "boolean", "object", "symbol"], 2),
    M("Which of the following are falsy values in JavaScript?", ["0", "\"\" (empty string)", "[] (empty array)", "null"], [0, 1, 3], "An empty array is truthy."),
    S("What does === check?", ["Value only", "Type only", "Value and type", "Reference only"], 2, "Strict equality compares value and type without coercion."),
    TF("JavaScript is a statically typed language.", false, "JavaScript is dynamically typed."),
    S("Which method creates a new array by applying a function to every element?", ["forEach()", "map()", "filter()", "reduce()"], 1),
    S("What does JSON.parse() do?", ["Converts an object to a JSON string", "Converts a JSON string to an object", "Sends JSON to a server", "Validates a JSON schema"], 1),
    S("Which block is used to handle exceptions?", ["try...catch", "if...else", "switch...case", "for...of"], 0),
    TF("A closure gives a function access to variables of its outer scope even after the outer function has returned.", true),
    S("What is the output of console.log(0.1 + 0.2 === 0.3)?", ["true", "false", "undefined", "Error"], 1, "Floating point precision makes the sum 0.30000000000000004."),
    S("Which keyword is used to wait for a Promise inside an async function?", ["yield", "await", "pause", "defer"], 1),
  ],

  "HTML & CSS": [
    S("What does HTML stand for?", ["Hyper Text Markup Language", "High Text Machine Language", "Hyperlinks and Text Markup Language", "Home Tool Markup Language"], 0),
    S("Which tag is used for the largest heading?", ["<h6>", "<head>", "<h1>", "<heading>"], 2),
    S("Which CSS property changes the text color?", ["font-color", "text-color", "color", "foreground"], 2),
    S("Which HTML attribute specifies alternate text for an image?", ["title", "alt", "src", "caption"], 1),
    S("In the CSS box model, which layer is the outermost?", ["Content", "Padding", "Border", "Margin"], 3),
    M("Which of these are semantic HTML5 elements?", ["<article>", "<div>", "<section>", "<span>"], [0, 2], "div and span have no semantic meaning."),
    TF("The <div> element is an inline element by default.", false, "div is a block-level element."),
    S("Which declaration turns an element into a flex container?", ["display: block", "display: flex", "display: inline", "display: table-cell"], 1),
    S("Which symbol selects an element by id in CSS?", [".", "#", "*", "&"], 1),
    S("Which tag creates a hyperlink?", ["<link>", "<a>", "<href>", "<url>"], 1),
    S("position: absolute places an element relative to what?", ["The viewport, always", "Its nearest positioned ancestor", "Its previous sibling", "The body, always"], 1),
  ],

  Python: [
    S("Which keyword defines a function in Python?", ["function", "def", "fun", "define"], 1),
    S("What is the output of print(type([]))?", ["<class 'list'>", "<class 'tuple'>", "<class 'dict'>", "<class 'array'>"], 0),
    S("Which of these data types is immutable?", ["list", "dict", "set", "tuple"], 3),
    S("What does len('Python') return?", ["5", "6", "7", "Error"], 1),
    TF("Python uses indentation to define code blocks.", true),
    S("Which operator performs floor division?", ["/", "//", "%", "**"], 1),
    M("Which of the following are built-in Python data types?", ["int", "float", "char", "bool"], [0, 1, 3], "Python has no separate char type; a character is a string."),
    S("How do you start a single-line comment in Python?", ["//", "#", "/*", "--"], 1),
    S("What does range(3) generate?", ["1, 2, 3", "0, 1, 2", "0, 1, 2, 3", "1, 2"], 1),
    S("Which method adds an item to the end of a list?", ["add()", "append()", "insert_end()", "push()"], 1),
    S("What is the output of print(2 ** 3)?", ["6", "8", "9", "5"], 1),
  ],

  "DBMS & SQL": [
    S("Which SQL command retrieves data from a table?", ["GET", "SELECT", "FETCH", "EXTRACT"], 1),
    S("Which key uniquely identifies each row in a table?", ["Foreign key", "Primary key", "Alternate key", "Super index"], 1),
    S("Which SQL clause filters rows?", ["ORDER BY", "WHERE", "JOIN", "LIMIT"], 1),
    TF("A foreign key refers to the primary key of another table.", true),
    S("Which JOIN returns only rows with matching values in both tables?", ["LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL OUTER JOIN"], 2),
    M("Which of these are SQL aggregate functions?", ["COUNT()", "SUM()", "CONCAT()", "AVG()"], [0, 1, 3], "CONCAT is a string function."),
    S("What does ACID stand for in databases?", ["Atomicity, Consistency, Isolation, Durability", "Accuracy, Control, Integrity, Data", "Atomicity, Concurrency, Integrity, Durability", "Access, Consistency, Isolation, Data"], 0),
    S("Which command removes all rows from a table but keeps its structure?", ["DROP TABLE", "DELETE TABLE", "TRUNCATE TABLE", "REMOVE TABLE"], 2),
    S("Which normal form removes partial dependencies?", ["1NF", "2NF", "3NF", "BCNF"], 1),
    S("Which statement modifies existing records?", ["MODIFY", "CHANGE", "UPDATE", "ALTER ROW"], 2),
    S("Which clause sorts the result set?", ["SORT BY", "ORDER BY", "GROUP BY", "ARRANGE"], 1),
  ],
};

export default questionBank;