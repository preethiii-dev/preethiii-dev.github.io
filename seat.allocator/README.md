\# Seat \& Room Allocator

A modern, responsive web application that automatically assigns room numbers and seat numbers to students based on uploaded student data.

\## Features

\- \*\*CSV Upload\*\* — Drag \& drop or click to upload a `.csv` file with student data

\- \*\*Manual Input\*\* — Paste or type student records directly if you have no file

\- \*\*Sorting\*\* — Sort students by Register Number or alphabetically by Name before allocation

\- \*\*Room Capacity\*\* — Configure how many seats each room holds (default: 30)

\- \*\*Automatic Allocation\*\* — Rooms start at 101; seats restart from 1 in each room

\- \*\*Search\*\* — Filter the results table by register number or student name (with highlighted matches)

\- \*\*CSV Export\*\* — Download the full allocation as a `.csv` file

\- \*\*Reset\*\* — Clear all data and start fresh

\- \*\*Toast Notifications\*\* — Friendly success/error feedback for every action

\- \*\*Responsive\*\* — Works on desktop, tablet, and mobile

\## Getting Started

Open `index.html` in any modern web browser — no server, build step, or installation required.

\## CSV Format

Your CSV file should have exactly two columns:



Register Number,Student Name 22CS001,Alice Johnson 22CS002,Bob Smith 22CS003,Charlie Brown



\- The \*\*first row\*\* may be a header (it will be automatically skipped).

\- Each subsequent row must have a register number and a student name separated by a comma.

\- A sample file `sample\_students.csv` is included in this project.

\## How to Use

1\. \*\*Upload data\*\* — Drag \& drop a CSV file onto the upload area, or click "Choose File". Alternatively, paste data into the text area below.

2\. \*\*Configure\*\* — Choose a sort order and enter the number of seats per room.

3\. \*\*Allocate\*\* — Click \*\*Allocate Seats\*\* to generate the room \& seat assignments.

4\. \*\*Review\*\* — Browse the results table. Use the search box to find specific students.

5\. \*\*Download\*\* — Click \*\*Download CSV\*\* to save the allocation to your computer.

6\. \*\*Reset\*\* — Click \*\*Reset All\*\* to clear everything and start over.

\## Allocation Logic

Students are allocated sequentially after sorting. Rooms start at \*\*101\*\* and seats restart at \*\*1\*\* for each new room.

\*\*Example\*\* (capacity = 2):

| Student | Room | Seat |

|---------|------|------|

| Alice   | 101  | 1    |

| Bob     | 101  | 2    |

| Charlie | 102  | 1    |

| Diana   | 102  | 2    |

| Edward  | 103  | 1    |

\## File Structure



seat-room-allocator/ ├── index.html # Main HTML page ├── README.md # This file ├── public/ │ ├── style.css # All styles │ ├── script.js # All application logic │ └── sample\_students.csv # Example CSV file

