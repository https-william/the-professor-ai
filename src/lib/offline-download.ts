/**
 * Offline Study Pack Download Utility
 * Compiles flashcard decks and quizzes into fully interactive, single-file HTML documents.
 * They run entirely on the client-side without any internet connection.
 */

// Helper to escape text for script/HTML injection
function escapeHtml(str: string): string {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

const BRAND_LOGO_SVG = `<svg class="brand-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 816 816"><path fill="#07092b" d="M201 0h417q21 0 41 4l2 1a178 178 0 0 1 53 21l2 1 2 1v2l3 1 12 7 4 3v2l2 1 8 5 3 3 4 6 4 2q13 13 24 29l1 1c3 5 3 5 3 8h2q16 28 24 59v2a168 168 0 0 1 4 47v412q0 18-3 34l-1 3-1 8-1 2a232 232 0 0 1-22 53h-2l-1 3-7 12-3 4h-2l-1 2c-7 13-21 26-33 34h-2v2l-8 6-2 1-2 2-2 1-5 1v2l-46 20-11 2-1 2c-20 7-45 5-66 4H198q-21 0-41-4l-3-1-7-2-4-1q-19-6-39-17l-6-3v-2h-2q-6-2-10-6l-2-1-5-4v-2l-2-1q-9-6-17-14v-2h-2v-2l-2-1q-4-2-6-6l-2-1-5-7v-2h-2l-5-7-1-2-5-10h-2q-16-28-24-59v-2a168 168 0 0 1-4-47V198q0-20 4-41l1-2a190 190 0 0 1 23-57h2v-2q2-6 6-10l1-2 4-5h2l1-2 5-8 3-3 6-4 2-4h2l1-2 7-8 2-1 7-4v-2l7-5 2-1 10-5v-2l15-8q21-10 44-16h3q20-5 41-4"/><path fill="#eee" d="m444 214 39 25 5 2v2l3 1q6 2 11 6l4 3 3 2 10 6 2 1 47 29 2 2 80 50c24 14 24 14 28 25q4 13-3 24l-5 6h-2v2l-4 1v2l-5 3-15 9-2 1-19 13-2 1-2 1q-6 3-12 2-5-3-8-8-2-7 0-12 8-9 20-15l12-8 3-1 3-2 2-1 4-6v-9l-3-1v-2l-2-1q-6-1-10-6l-3-1-25-16-29-18-52-32-45-29-4-2-15-9-17-11-3-1-2-2-4-2-2-2-2-1q-9-4-20-1l-15 8-11 7-2 1-24 15-5 2v2l-3 1-14 9-7 3v2l-2 1-16 10-5 1v2l-40 25-3 2-26 16-11 6-10 7-4 1v2l-2 1-11 7-5 3-5 4v7l1 5 25 16 42 26 2 1 10 7 2 1 11 6v2l2 1 8 5 5 2 13 9 39 23v2l3 1 8 5 5 3 8 5 2 1 13 8 3 2 4 3q13 11 29 9 10-3 17-9l5-3 3-2 7-4 2-2 82-51c11-6 11-6 18-4l7 6q2 7 0 13-9 10-22 16h-2v2l-2 1-30 18-2 1-2 2-2 1-38 23-6 3v2l-2 1-12 7q-17 10-35 8-9-1-16-6v-2h-2q-8-4-17-10l-9-6-4-2-45-29-7-4-13-8-18-11c-8-6-8-6-16-9v97c0 14 0 14 6 26l8 5 9 4a115 115 0 0 0 34 10l19 4h2q38 5 75 5h3q40 1 81-6l4-1 43-11c9-3 21-7 25-16l1-8v-10l1-103 3 3 2 1 5 6 2 3 1 2 2 2q6 9 5 20v63c0 25 0 25-6 34l-1 2q-7 10-18 13v2q-21 11-44 14l-4 2-23 4a386 386 0 0 1-228-20l-3-1q-11-5-18-15v-2h-2q-8-20-5-41v-94c0-6 0-6-3-11l-8-5-23-15-5-2-14-9-16-10q-14-6-20-20-2-13 3-24 9-9 20-16l62-39 21-13 77-47 47-30c23-15 42-19 66-3"/><path fill="#2464a2" d="m450 320 11 8c22 16 22 16 26 29q1 12-2 23h3q12 2 23 6l9 4 14 5v2l3 1 10 5 2 1 12 8 6 4 8 7 2 2 2 1v2h2v2l2 1 5 5 2 2 2 2 3 4 2 1 2 3 4 5 2 2 1 2 1 2c14 21 14 21 14 25h2l17 42 1 2 2 7v2l3 12h5v2h4q7 2 12 8 8 10 6 22l-2 7-1 2q-5 10-15 13l-7 1h-3q-10 1-18-8l-2-2q-7-8-6-19 2-12 9-19l2-1q1-7-2-12l-6-19c-5-11-5-11-5-16h-2l-1-2q-1-7-6-14l-1-3-6-9-3-6-9-12-4-5q-24-31-61-48l-3-1-13-5v-2l-16-2-9-4h-3l-1 4-1 5-1 2-5 14-1 5h-2v2l-5 8h-2v2c-12 12-34 10-50 10-39-1-39-1-47-9l-3-4-3-2q-4-6-5-13l-5-14-6-18-1-4-2-9-1-2q-2-14 5-26 6-8 15-14l7-6 5-2 8-5 4-4 4-2v-2l6-2v-2l2-1 3-1 3-1 3-2c18-4 32 7 46 18"/><path fill="#ddb238" d="M660 553q10 7 13 18 1 9-2 17l-1 2q-5 10-15 13l-7 1h-3q-10 1-18-8l-2-2q-7-8-6-19 2-12 9-19 15-10 32-3"/><path fill="#b8a260" d="M660 553q10 7 13 18 1 9-2 17l-1 2q-5 10-15 13l-7 1h-3q-10 1-18-8l-2-2q-7-8-6-19 2-12 9-19 15-10 32-3m-34 8q-6 11-4 23 2 6 6 11h2l1 3q10 7 22 3 6-2 12-7l1-4h2v-5l2-1-2-20h-2l-1-2-5-6h-4l-1-2q-17-6-29 7"/><path fill="#295a8d" d="M476 403q2 5-1 10l-1 3-1 3-2 6h-2v2l-5 8h-2v2c-12 12-34 10-50 10l-34-2-1-3h2l41 1 32-1v-3h2l1-2q3-4 7-3v-2h2l5-14 4-7 2-6z"/><path fill="#bcbec4" d="M232 445h6l1 8v33l-2 86V451q-2-4-5-6"/><path fill="#295a8c" d="M507 399h2v2l13 2v2l6-2v4l6 3v2h2l8 4 3 1 2 2 2 1 5 5 2 1q4 2 6 6l-1 2-2-2q-10-8-22-15l-3-2q-13-8-28-12v-2l-16-2-4-1-1-2q11-3 20 3"/><path fill="#c5c6cc" d="M585 481q4 3 4 8v25l-1 70h-1l-1-18v-2l-1-76 2-3h-2z"/><path fill="#d1d2d7" d="M395 630q6 2 6 4h53v1l-24 1h-3l-80-3v-1h18l4-1 5 1v1h5v-1l16-1z"/><path fill="#dbdcdf" d="m339 274-6 4-2 1-7 3v2l-2 1-16 10-5 1v2l-11 6v-3l2-1v-3h5l2-3h4l1-3 7-1 1-2q1-3 4-4l3-1-1-6 6 1h2l1-1h5l1-3z"/><path fill="#d7d8dc" d="m519 606-11 3-8 2-7 1h-2l2 2-8 1-50 1v-1h2a418 418 0 0 0 82-9"/><path fill="#d0d1d6" d="m569 460 13 15 3 4h-5l-2-1v-4l-5-2-2 1-1-3v39h-1z"/><path fill="#29598b" d="M640 534h2l4 15h5v1h-3l-3 1h-4l-7 3h-3l-1-9q4 3 8 1l3-1z"/><path fill="#29598a" d="M577 426h2v2h2v2l2 1 5 5 2 2 2 2 3 4 2 1 2 3 6 7 2 3 1 2-2 4c-5-6-5-6-5-8h-2l-1-4-5-8-3-1v-2h-2l-4-3-2-3-4-5z"/><path fill="#295a8d" d="M486 360h1q1 10-2 20h3l25 7 3 1 2 1v1q-8 0-16-4l-7-1-4-1h-3q-5-1-5-3-3-8 2-14z"/><path fill="#295889" d="M528 394q6 2 10 5l2 1 12 8 6 4 8 7 2 2 2 1v2h2v2l2 1 5 5 2 2 2 2 3 4 2 1 2 3 6 7 2 3 1 2-2 4c-5-6-5-6-5-8h-2l-1-4-5-8-3-1v-2h-2l-4-3-2-3-4-5z"/><path fill="#e1e2e5" d="m408 545 2 1 5 1h5l1-2 2 1q4 1 7-1l3 2q-18 8-37 1v-1h11z"/><path fill="#dadbde" d="m512 257 19 11 9 6 1 1v4l-5-2v-2l-3-1-1-3h-3l-5-1-1-2-3 1-2-6-5-1z"/><path fill="#e1e2e5" d="m198 357 1 2 2 1-12 8-5 4v7q0 4 3 7l-3 1-3-2v-3l-2-1 2-1 1-4v-4l-2-1q5-7 13-10z"/><path fill="#e4e5e7" d="m585 303 20 12 2 1 5 4-4 2-1-3h-3v-2q-3-3-8-1l-2 1 1-3-4-3 1-2-5-2v-2h-2z"/><path fill="#dadbde" d="m541 448 1 2-2 2-3 4-5 2-2 2-6 1 2 5h-4v-2l-5-1 13-9 2-1z"/><path fill="#dbdde0" d="m484 240 4 1v2l3 1 9 5 4 2 2 2-3 5-4-5-3-1v-2l-9-1v-2h2q-2-3-5-4z"/><path fill="#d4d5d9" d="M552 593h2l-1 5q-3 2-8 3v3h-4l-14-1 8-4 3-1 3-1 8-2z"/><path fill="#295889" d="M626 494q4 3 5 8l5 12q6 9 5 17l-1 2-1-2-5-11-4-12-3-10z"/><path fill="#d8dadd" d="m626 395-1 4h-2l-1 3-3 2q-3 1-5 4l-6 1q-3 0-5 3l-2-1 15-11 6-3z"/><path fill="#dedfe2" d="M531 480h9l-4 2v2l-2 1-22 13-1-4q3-2 8-2v-2q5-5 12-6h2z"/><path fill="#dcdde0" d="M648 342c19 10 19 10 21 14h-8l-2-2-3-1-1-1q-4-3-8-4z"/><path fill="#e0e1e4" d="M582 332h6l2 4h4v3l6-2 2 2-1 2 3 1 7 7-7-2-3-2-3-2-7-4-3-2z"/><path fill="#29598b" d="M462 330q8 4 15 10l3 2q6 7 6 16l-1 2q-4-5-5-11l-1-2v-2h-2l-1-2q-3-4-7-5l-3-3-2-2-2-1z"/><path fill="#d8dadd" d="m365 225 2 1v3l-2 1v2h-4l-1 2q-3 4-7 4h-3l-3 1-1-2 9-6 3-2 3-1 2-2z"/><path fill="#295889" d="M615 504q11 12 13 29v6l-3-7-6-16-2-8h-2z"/><path fill="#dbdce0" d="m458 224 10 5 7 5 2 1v2l-6-2-1 2-5-2 1-3-6-1z"/><path fill="#e0e1e4" d="m154 392 5 1 1 3 4 2 2 2 5 1 2 7q-5-1-11-6l-2-1-2-2-2-2-3-4z"/><path fill="#dedfe2" d="m344 238 2 1-1 4-5 2-2 2q-5 5-13 6v-3l6-4z"/><path fill="#dcdde0" d="m581 591 3 1q-6 12-18 17h-2v2h-3l-1-4q6-3 11-3v-2l2-1 3-4 3-4h2zM569 575h2l-1 15h-12l2-1q7-5 9-14"/><path fill="#dedfe2" d="m430 207 12 6 3 2 2 1-1 2-5 1h-5l-1-2v-2l-1-2-4-4z"/><path fill="#d6d8db" d="m216 404 25 15-2 2q-5 0-11-4v-2l-6-3v-3l-4-1v-2h-2z"/><path fill="#e2e3e5" d="m277 280 2 1-5 9h-9l-2 4-5 1v-3l4-3 3-2 2-1 3-2z"/><path fill="#295686" d="M420 302v1l-16 1-1 3-8 2v2l-8 2v-2l6-2v-2l2-1 3-1 3-1 3-2zm-35 11 2 1v2l-5 1v-2z"/><path fill="#dadbde" d="M507 496h2l1 3-7 5-2 1-14 8q1-4 4-7l16-8z"/><path fill="#d9dbde" d="m339 482 5 1v2l3 1 8 5 5 3-2 1-1 2-1-4h-9l-1-3h-3l-1-5-3 1z"/><path fill="#dedfe2" d="m619 324 7 4 2 1q5 2 8 6l-7 1-4-1-2-5h-4z"/><path fill="#dadbde" d="m354 258 2 1h6c-10 8-10 8-14 8v2l-4 1-1-3 3-3q4-1 5-5z"/><path fill="#295889" d="M603 480q5 1 7 5l2 4 1 2q3 5 2 12-3-1-4-6l-2-2z"/><path fill="#d5d6da" d="M199 330v5q-3 3-8 2v2l2 1c-5 2-5 2-9 1l-2-1 10-7 3-2z"/><path fill="#dedfe2" d="m246 331-11 8-2 2-7 1-1-3h2l1-2 4-1 6-2 1-3z"/><path fill="#d6d7db" d="m322 252 2 1-2 1-3 3-1 3-1 2-5 1v2h-9l11-8z"/><path fill="#d9dbde" d="M459 527h5q-4 5-10 6v2l-9 4-3-5 3-1 1 1 2-1 6-1v-4h2v2h2z"/><path fill="#dbdce0" d="M559 466q-7 9-18 14l-1-3 2-1q5-1 5-5 5-6 12-5"/><path fill="#d6d8dc" d="m262 586 2 1 2 1 2 2 7 3 6 3 3 1 2 1v1l-12-3v-2l-4 3-3-2 1-4-4 1v-2h-2z"/><path fill="#295889" d="m356 422 6 7 3 2 2 2v3l2 1v2l3 1 4 3-4-1-2-1q-5-2-8-6l-3-3q-3-4-3-10"/><path fill="#d5d6d9" d="m344 514 3 1 3-1v5h3q7 1 10 5l1 4-13-7-3-2-5-3z"/><path fill="#dadbde" d="m174 345-3 9h-2v2h-6l-1-4 5-3 3-2z"/><path fill="#dfe0e3" d="m564 290 17 10-2 3h-2v-3h-2v2l-4-1v-2l-1-2-2-1-3-1zM393 239l-8 7-3 1-8 4v-5l4-1 7-4q3-2 8-2"/><path fill="#295b8e" d="M346 344c1 4 1 4-1 8l-1 2-1 2h-2q0 9 2 18v8q-6-11-4-23 1-8 7-15"/><path fill="#d7d8dc" d="m544 304 1 2 5 2 2 2h2l2 2 2 1v4l-9-5-3-1-7-6z"/><path fill="#c9cbd0" d="m506 625 1 1h9v1l-4 1h-5l-3 1-15 3-6-1 9-1 1-3q6-2 13-2"/><path fill="#295a8d" d="m583 452 4 3 2 1 3 5 2 2 5 8 2 3 1 3-1 2-2-3-14-20z"/><path fill="#d2d3d8" d="m156 357-1 5h-2l1 3-2 3v3l2 1-2 2q-3 4-3 10h-1q-3-13 5-24z"/><path fill="#dddee1" d="m390 513 2 1q7 5 14 7l-3 1 1 4-6-2v-2h-2l-2-3-5-2z"/><path fill="#d5d6da" d="M447 239v3h-2l1 4h7l1 6-12-6-2-1-4-3 6-1z"/><path fill="#cecfd4" d="m454 252 11 2 1 3 4 2 1-1q3 2 2 6l-14-8-5-3z"/><path fill="#c2c3ca" d="m305 604 11 2 22 4v1l-21-2h-5l-6-1z"/><path fill="#29598b" d="m613 470 6 8 1 2 1 4h2c3 7 3 7 2 10l-3-5-2-3-3-5-3-3z"/><path fill="#d5d7da" d="m193 414 2 1v5h4v3l3 1-1 2-17-10v-1c6 0 6 0 9 2z"/><path fill="#e0e1e4" d="m281 306 3 2-9 6-3 2-3 1-2 2-4 1q3-6 8-9l7-2 3-1z"/><path fill="#cfd1d5" d="m263 605 2 1-1 2h2l3 3 1 2 2-1 6 1 1 4-5-1-2-1-7-4-4-2-3-1 2-1z"/><path fill="#dbdcdf" d="M306 461q6 2 11 6l3 2 2 1q-4 3-9 2l2-1v-2l-2-1-8-4z"/><path fill="#dcdde0" d="m263 460 5 2v3l5 1 1 3-1 2-10-5-3-2-2-1 5-2z"/><path fill="#d9dade" d="M249 425q9 4 16 9l-1 2-8-1-2-2v-2h-2l-1-4h-2z"/><path fill="#294e79" d="M507 399h2v2l13 2v2l6-2v4l6 3v2h2l8 4 3 1 2 2 2 1 5 5 2 1q4 2 6 6l-1 2-2-2q-10-8-22-15l-3-2q-13-8-28-12v-2l-16-2-4-1-1-2q11-3 20 3"/><path fill="#dcdee1" d="M274 441h3v2l2 1q6 2 10 6l-1 3-7-2-1-3h-2l-1-3-3-2z"/><path fill="#d2d4d8" d="m433 236 3 5-9-4q-6-5-15-5v-1q12-3 21 5"/><path fill="#d9dbde" d="M212 347h5v3l-4 3-2 1-4 1v2l-6 2-1-3 5-1 1-3 5-3z"/><path fill="#d8d9dc" d="m229 310 2 1-5 4-2 3h-2l-1 3-1 2-5-1 1-4 8-5z"/><path fill="#c9cbd0" d="m329 625 2 3 6 2-3 1h-3l-3-1-3-1-7-1v-1l4-2h7"/><path fill="#cfd0d5" d="M507 285h7v2l5 2v2l3-1v2l2 4-17-10z"/><path fill="#d2d3d7" d="m394 207 2 1-1 1-2 2-2 1-4 6h-5l-1-3 6-4 2-1z"/><path fill="#c0c2c8" d="m368 631 6 1v1l6 1v1l-23-1h-3l-7-1v-1h18z"/><path fill="#d7d8dc" d="m492 479 1 3-5 4h-7c7-7 7-7 11-7"/><path fill="#c7c8cd" d="m300 619 4 3-1 2 2 1-5-1h-3l-5-3q3-2 8-2"/><path fill="#d7d9dd" d="m600 312 12 7-2 3-3-1v-2h-3v-2l-3-1z"/><path fill="#cfd0d5" d="m408 545 2 1-2 1zm-12 2h8l5 2v2q-7 0-13-3z"/><path fill="#d5d7db" d="m322 498 4 2v2l4 2v3l-5-3-3-1-4-4 4 1z"/><path fill="#dedfe2" d="m642 415-9 7-3-1q5-7 12-6"/><path fill="#d8d9dd" d="m336 611h7l7 2-3 1-4 2z"/><path fill="#cfd0d5" d="M333 506c7 2 7 2 9 6l1 3-12-7z"/><path fill="#dcdde1" d="m252 323 5 1-5 4-2 2-2 1-3-1 1-3 6-2z"/><path fill="#d6d8db" d="M549 281c7 2 7 2 9 5l-1 4-5-4v-3l-3 1z"/><path fill="#d9dade" d="m351 613 19 1v1h-3l-5 2-7-1-2-1-2-1z"/><path fill="#d3d4d9" d="m627 422 3 2-6 4-2 1-5 3-2-1 1-3 7-1 1-3z"/><path fill="#c9cacf" d="M582 332h6l2 4h4l1 4-13-7z"/><path fill="#cfd1d5" d="M598 416h1v5l5 2v5h-3q-3-5-3-12"/><path fill="#d5d6da" d="m388 539 2 5h2v-3h2l2 6-7-2v-2l-4-1z"/><path fill="#d3d4d9" d="m627 422 3 2-6 4-2 1-5 3-2-1 1-3 7-1 1-3z"/><path fill="#cdcfd3" d="m198 357 1 2 2 1-9 6-1-3z"/><path fill="#c9cacf" d="M582 332h6l2 4h4l1 4-13-7z"/><path fill="#dedfe2" d="M519 604h6l-4 7-1-1-4-3 3-1z"/><path fill="#cdced3" d="m506 469 2 1-3 5h-2l-1 2-5-1c5-6 5-6 9-7"/><path fill="#dcdde0" d="M191 337v2l2 1c-5 2-5 2-9 1l-2-1q4-4 9-3"/><path fill="#d7d8db" d="M530 297q4 0 7 3l-1 4-8-5z"/><path fill="#d7d8dc" d="m396 232 2 1h3l1-1h6l-7 4-2 1-4 1z"/><path fill="#ac9961" d="m668 591 1 2-5 5-3 2-5 2q2-5 7-8l3-2z"/><path fill="#dedfe2" d="m324 472 8 4-2 3-6-2z"/><path fill="#cecfd3" d="M182 375h1v2l1 2v3l3 4-3 1-3-2v-3l-2-1 2-1z"/><path fill="#d9dade" d="m440 538 5 1q-4 5-10 6l-1-2h2l3-3z"/><path fill="#2a5787" d="m347 395 2 1 1 7h2l1 6-2 1z"/><path fill="#caccd0" d="m171 401 2 7-10-5q3-2 8-2"/><path fill="#d9dade" d="m440 538 5 1q-4 5-10 6l-1-2h2l3-3z"/><path fill="#e3e4e6" d="M304 291h4q0 3-4 5h-7l2-2h4z"/><path fill="#c6c8cd" d="M444 246h9l1 6-10-5z"/><path fill="#dfe0e3" d="M519 492v2l-8 4v-5z"/><path fill="#dedfe2" d="m585 481 3 3v12c-3-5-3-5-3-8l2-3h-2z"/><path fill="#d5d6da" d="M226 441h9q-2 4-5 4z"/><path fill="#dadcdf" d="m200 394 7 4-1 2-5-1v-2l-2-1z"/><path fill="#d8d9dd" d="m564 290 8 4-4 2-3-1z"/><path fill="#c9ad5b" d="M641 551v2l-9 3q3-5 9-5"/><path fill="#d9dade" d="m480 513 5 1-7 5z"/><path fill="#d1d2d7" d="m314 493 1 3h2l1 3q-5-1-8-5zM608 405l3 1-7 5h-3l3-3 2-2z"/><path fill="#d2d3d7" d="m585 303 8 4-1 2-5-2v-2h-2z"/><path fill="#d4d5d9" d="m328 248 3 1-5 5-2-3z"/><path fill="#d8d9de" d="m424 232-1 2-11-2v-1q7-2 12 1"/><path fill="#d7d8dc" d="M249 598q4 1 6 5v2l-6-4z"/><path fill="#ccced3" d="m479 486 2 1q-3 5-10 5 3-4 8-6"/><path fill="#cfd0d5" d="m306 488 4 1v5l-4-1-1-2 2-1z"/><path fill="#d6d7db" d="M232 445h6l1 5-2 1z"/><path fill="#e1e2e5" d="M600 412h1l1 8-3 1z"/><path fill="#d9dade" d="m208 399 7 4-2 2h-3z"/><path fill="#d1d2d6" d="m672 362 4 1 1 5h-2v-3h-3z"/><path fill="#bfc1c6" d="m180 340 2 1-5 6-1-2-2-1z"/><path fill="#c9cacf" d="m285 275 2 1-3 5-5-1z"/><path fill="#b5b7be" d="M279 617h9v3c-7-1-7-1-9-3"/><path fill="#cacbd0" d="m297 486 6 1 2 4q-5-1-8-5"/><path fill="#c5c6cc" d="m216 404 7 4v3l-1-2-4-1v-2h-2zM541 304h3v4h2l-1 2-6-4z"/></svg>`;

export function downloadFlashcardsOffline(title: string, flashcards: any[]) {
    const safeTitle = escapeHtml(title);
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle} - Offline Flashcards</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --background: #050508;
            --card: #0c0c16;
            --border: #1a1a2e;
            --border-hover: #2a2a4e;
            --blue: #2563eb;
            --blue-dim: rgba(37, 99, 235, 0.1);
            --blue-border: rgba(37, 99, 235, 0.25);
            --blue-light: #60a5fa;
            --text: #ffffff;
            --text-muted: #8e8e9f;
            --accent: #2563eb;
            --crimson: #ef4444;
            --crimson-dim: rgba(239, 68, 68, 0.1);
            --crimson-border: rgba(239, 68, 68, 0.25);
            --emerald: #10b981;
            --emerald-dim: rgba(16, 185, 129, 0.1);
            --emerald-border: rgba(16, 185, 129, 0.25);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--background);
            color: var(--text);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            min-height: 100vh;
            display: flex;
            flex-col: column;
            flex-direction: column;
            align-items: center;
            user-select: none;
            overflow-x: hidden;
            padding-bottom: 50px;
        }

        header {
            width: 100%;
            max-width: 1000px;
            padding: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border);
        }

        .brand-logo {
            width: 32px;
            height: 32px;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .offline-badge {
            font-size: 8px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 4px 8px;
            border-radius: 99px;
            color: var(--text-muted);
        }

        .study-mode-label {
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: var(--blue-light);
            margin-bottom: 2px;
        }

        h1 {
            font-size: 14px;
            font-weight: 700;
            color: var(--text);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-w: 300px;
        }

        main {
            flex: 1;
            width: 100%;
            max-width: 650px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .progress-container {
            width: 100%;
            margin-bottom: 30px;
        }

        .progress-header {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--text-muted);
            margin-bottom: 10px;
        }

        .progress-bar-bg {
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 99px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            overflow: hidden;
        }

        .progress-bar-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #3b82f6, #2563eb);
            border-radius: 99px;
            transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 0 12px rgba(37, 99, 235, 0.5);
        }

        .progress-footer {
            font-family: monospace;
            font-size: 10px;
            color: rgba(142, 142, 159, 0.6);
            margin-top: 8px;
            text-align: right;
        }

        .card-perspective {
            width: 100%;
            aspect-ratio: 4/3;
            perspective: 1000px;
            cursor: pointer;
        }

        .card-inner {
            position: relative;
            width: 100%;
            height: 100%;
            transform-style: preserve-3d;
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-inner.flipped {
            transform: rotateY(180deg);
        }

        .card-face {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            -webkit-backface-visibility: hidden;
            border-radius: 28px;
            border: 1.5px solid var(--border);
            padding: 32px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
            transition: border-color 0.3s;
        }

        .card-perspective:hover .card-face {
            border-color: var(--border-hover);
        }

        .card-front {
            background: var(--card);
        }

        .card-back {
            background: var(--card);
            transform: rotateY(180deg);
        }

        .front-text {
            font-size: 24px;
            font-weight: 900;
            text-align: center;
            line-height: 1.3;
            letter-spacing: -0.02em;
            padding: 0 16px;
        }

        .back-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            height: 100%;
            padding: 16px 0;
        }

        .back-text-wrapper {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow-y: auto;
            padding: 0 16px;
        }

        .back-text {
            font-size: 18px;
            font-weight: 500;
            text-align: center;
            line-height: 1.5;
            color: var(--blue-light);
            font-style: italic;
        }

        .tip-box {
            width: 100%;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border);
            padding: 16px;
            border-radius: 16px;
            text-align: left;
            margin-top: 24px;
        }

        .tip-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            color: #d97706;
            margin-bottom: 6px;
        }

        .tip-text {
            font-size: 12px;
            line-height: 1.4;
            color: var(--text-muted);
            font-style: italic;
        }

        .tap-prompt {
            position: absolute;
            bottom: 32px;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.20em;
            opacity: 0.35;
        }

        .actions-container {
            margin-top: 40px;
            width: 100%;
            max-width: 380px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        button {
            border: none;
            outline: none;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.2s;
        }

        .primary-btn {
            width: 100%;
            height: 56px;
            border-radius: 16px;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.20em;
            background: var(--text);
            color: var(--background);
        }

        .primary-btn:hover {
            opacity: 0.9;
        }

        .primary-btn:active {
            transform: scale(0.98);
        }

        .eval-buttons {
            display: none;
            align-items: center;
            gap: 16px;
        }

        .eval-buttons.active {
            display: flex;
        }

        .eval-btn {
            flex: 1;
            height: 56px;
            border-radius: 16px;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.20em;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border: 1px solid transparent;
        }

        .dont-know-btn {
            border-color: var(--crimson-border);
            background: var(--crimson-dim);
            color: var(--crimson);
        }

        .dont-know-btn:hover {
            background: rgba(239, 68, 68, 0.2);
        }

        .dont-know-btn:active {
            transform: scale(0.98);
        }

        .got-it-btn {
            border-color: var(--emerald-border);
            background: var(--emerald-dim);
            color: var(--emerald);
        }

        .got-it-btn:hover {
            background: rgba(16, 185, 129, 0.2);
        }

        .got-it-btn:active {
            transform: scale(0.98);
        }

        .footer-nav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            margin-top: 24px;
        }

        .nav-btn {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border);
            padding: 14px 20px;
            border-radius: 16px;
            color: var(--text);
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .nav-btn:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: var(--border-hover);
        }

        .nav-btn:disabled {
            opacity: 0.2;
            cursor: not-allowed;
        }

        .counter-badge {
            background: var(--card);
            border: 1px solid var(--border);
            padding: 12px 24px;
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 140px;
        }

        .counter-badge-label {
            font-size: 8px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: var(--text-muted);
            margin-bottom: 2px;
        }

        .counter-badge-value {
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            color: var(--blue-light);
        }

        /* End View styles */
        .verdict-container {
            display: none;
            width: 100%;
            border-radius: 40px;
            background: rgba(255, 255, 255, 0.01);
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 48px;
            flex-direction: column;
            align-items: center;
            text-align: center;
            box-shadow: 0 20px 50px rgba(0,0,0,0.4);
            animation: fadeIn 0.5s ease;
        }

        .verdict-icon {
            width: 64px;
            height: 64px;
            border-radius: 20px;
            background: var(--blue-dim);
            color: var(--blue);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            margin-bottom: 24px;
        }

        .verdict-title {
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.3em;
            color: var(--blue-light);
            margin-bottom: 8px;
        }

        .verdict-score {
            font-size: 72px;
            font-weight: 900;
            color: var(--text);
            line-height: 1;
            margin-bottom: 24px;
        }

        .verdict-remark {
            font-size: 14px;
            font-style: italic;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.7);
            max-width: 400px;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <header>
        <div class="header-left">
            ${BRAND_LOGO_SVG}
            <div>
                <p class="study-mode-label">The Professor AI | Active Recall</p>
                <h1>${safeTitle}</h1>
            </div>
        </div>
        <div class="offline-badge">Offline Active</div>
    </header>

    <main id="study-view">
        <div class="progress-container">
            <div class="progress-header">
                <span>Sprint Progress</span>
                <span id="progress-text">0 / 0 Mastered</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" id="progress-bar"></div>
            </div>
            <div class="progress-footer" id="pointer-text">
                Card 1 of 1
            </div>
        </div>

        <div class="card-perspective" id="card-trigger">
            <div class="card-inner" id="card-inner">
                <div class="card-face card-front">
                    <p class="front-text" id="card-front-text">Front</p>
                    <span class="tap-prompt">Tap Card to Flip</span>
                </div>
                <div class="card-face card-back">
                    <div class="back-container">
                        <div class="back-text-wrapper">
                            <p class="back-text" id="card-back-text">Back</p>
                        </div>
                        <div class="tip-box">
                            <div class="tip-header">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                                <span>Professor's Tip</span>
                            </div>
                            <p class="tip-text" id="card-tip-text">Tip text</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="actions-container">
            <button class="primary-btn" id="reveal-btn">Reveal Answer</button>
            <div class="eval-buttons" id="eval-box">
                <button class="eval-btn dont-know-btn" id="dont-know-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    Don't Know
                </button>
                <button class="eval-btn got-it-btn" id="got-it-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
                    Got It
                </button>
            </div>

            <div class="footer-nav">
                <button class="nav-btn" id="prev-btn" disabled>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
                    Prev
                </button>
                <div class="counter-badge">
                    <span class="counter-badge-label">Recall Deck</span>
                    <span class="counter-badge-value" id="counter-text">Card 1 / 1</span>
                </div>
                <button class="nav-btn" id="next-btn">
                    Next
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
                </button>
            </div>
        </div>
    </main>

    <main id="verdict-view" style="display: none;">
        <div class="verdict-container" id="verdict-container" style="display: flex;">
            <div class="verdict-icon">🎓</div>
            <div class="verdict-title">Session Complete</div>
            <div class="verdict-score" id="final-mastered">100%</div>
            <p class="verdict-remark">
                "You've reviewed all memory cards. High-yield recall loops complete."
            </p>
            <button class="primary-btn" style="margin-top: 32px;" onclick="window.location.reload();">Study Again</button>
        </div>
    </main>

    <script>
        const cards = ${JSON.stringify(flashcards)};

        let queue = Array.from({ length: cards.length }, (_, i) => i);
        let pointer = 0;
        let isFlipped = false;
        const mastered = new Set();

        const cardTrigger = document.getElementById('card-trigger');
        const cardInner = document.getElementById('card-inner');
        const cardFrontText = document.getElementById('card-front-text');
        const cardBackText = document.getElementById('card-back-text');
        const cardTipText = document.getElementById('card-tip-text');
        
        const revealBtn = document.getElementById('reveal-btn');
        const evalBox = document.getElementById('eval-box');
        const dontKnowBtn = document.getElementById('dont-know-btn');
        const gotItBtn = document.getElementById('got-it-btn');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const counterText = document.getElementById('counter-text');
        
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const pointerText = document.getElementById('pointer-text');

        const studyView = document.getElementById('study-view');
        const verdictView = document.getElementById('verdict-view');
        const finalMastered = document.getElementById('final-mastered');

        function updateUI() {
            if (pointer >= queue.length) {
                // Complete
                studyView.style.display = 'none';
                verdictView.style.display = 'flex';
                finalMastered.textContent = Math.round((mastered.size / cards.length) * 100) + '%';
                return;
            }

            const currentIdx = queue[pointer];
            const currentCard = cards[currentIdx];

            // Render text
            cardFrontText.textContent = currentCard.front || "";
            
            // Format back
            const backTextRaw = currentCard.back || "";
            const parts = backTextRaw.split("💡");
            const answer = parts[0].trim();
            const tip = parts[1] ? parts[1].replace(/Professor's Protocol:|Protocol:/i, "").trim() : "Focus on the core concept.";
            
            cardBackText.textContent = answer;
            cardTipText.textContent = tip;

            // Flipped status
            if (isFlipped) {
                cardInner.classList.add('flipped');
                revealBtn.style.display = 'none';
                evalBox.classList.add('active');
            } else {
                cardInner.classList.remove('flipped');
                revealBtn.style.display = 'block';
                evalBox.classList.remove('active');
            }

            // Stats
            const progress = Math.round((mastered.size / cards.length) * 100);
            progressBar.style.width = progress + '%';
            progressText.textContent = mastered.size + ' / ' + cards.length + ' Mastered';
            pointerText.textContent = 'Card ' + (pointer + 1) + ' of ' + queue.length + ' in round';
            counterText.textContent = 'Card ' + (pointer + 1) + ' / ' + queue.length;

            prevBtn.disabled = pointer === 0;
        }

        function toggleFlip() {
            isFlipped = !isFlipped;
            updateUI();
        }

        function evaluate(isMastered) {
            const currentIdx = queue[pointer];
            if (isMastered) {
                mastered.add(currentIdx);
            } else {
                queue.push(currentIdx);
            }

            isFlipped = false;
            pointer++;
            updateUI();
        }

        cardTrigger.addEventListener('click', toggleFlip);
        revealBtn.addEventListener('click', toggleFlip);
        dontKnowBtn.addEventListener('click', () => evaluate(false));
        gotItBtn.addEventListener('click', () => evaluate(true));
        
        prevBtn.addEventListener('click', () => {
            if (pointer > 0) {
                pointer--;
                isFlipped = false;
                updateUI();
            }
        });

        nextBtn.addEventListener('click', () => {
            if (pointer < queue.length - 1) {
                pointer++;
                isFlipped = false;
                updateUI();
            } else {
                // Submit/Finish
                pointer = queue.length;
                updateUI();
            }
        });

        // Key Listeners
        window.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                toggleFlip();
            } else if (e.key.toLowerCase() === 'j') {
                if (isFlipped) evaluate(false);
            } else if (e.key.toLowerCase() === 'k') {
                if (isFlipped) evaluate(true);
            }
        });

        updateUI();
    </script>
</body>
</html>`;

    triggerDownload(`${safeTitle}_Flashcards.html`, html);
}

export function downloadQuizOffline(title: string, quizQuestions: any[], timerSeconds = 600) {
    const safeTitle = escapeHtml(title);
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle} - Offline Assessment</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --background: #050508;
            --card: #0c0c16;
            --border: #1a1a2e;
            --border-hover: #2a2a4e;
            --blue: #2563eb;
            --blue-dim: rgba(37, 99, 235, 0.1);
            --blue-border: rgba(37, 99, 235, 0.25);
            --blue-light: #60a5fa;
            --text: #ffffff;
            --text-muted: #8e8e9f;
            --accent: #2563eb;
            --crimson: #ef4444;
            --crimson-dim: rgba(239, 68, 68, 0.1);
            --crimson-border: rgba(239, 68, 68, 0.25);
            --emerald: #10b981;
            --emerald-dim: rgba(16, 185, 129, 0.1);
            --emerald-border: rgba(16, 185, 129, 0.25);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--background);
            color: var(--text);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            user-select: none;
            overflow-x: hidden;
            padding-bottom: 60px;
        }

        header {
            width: 100%;
            max-width: 1000px;
            padding: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border);
        }

        .brand-logo {
            width: 32px;
            height: 32px;
        }

        .study-mode-label {
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: var(--blue-light);
            margin-bottom: 2px;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        h2 {
            font-size: 14px;
            font-weight: 700;
            color: var(--text);
        }

        .timer-badge {
            padding: 6px 16px;
            border-radius: 12px;
            font-family: monospace;
            font-size: 12px;
            font-weight: 700;
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255,255,255,0.5);
            background: rgba(255,255,255,0.03);
        }

        .timer-badge.urgent {
            color: var(--crimson);
            border-color: var(--crimson-border);
            background: var(--crimson-dim);
            animation: pulse 1s infinite alternate;
        }

        main {
            flex: 1;
            width: 100%;
            max-width: 768px;
            padding: 24px;
            margin-top: 24px;
        }

        .question-pills {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 32px;
            overflow-x: auto;
            padding-bottom: 12px;
        }

        .question-pills::-webkit-scrollbar {
            display: none;
        }

        .pill {
            height: 32px;
            min-width: 32px;
            padding: 0 12px;
            border-radius: 99px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            background: transparent;
            color: rgba(255,255,255,0.3);
            border: 1px solid transparent;
            cursor: pointer;
            transition: all 0.2s;
        }

        .pill:hover {
            background: rgba(255,255,255,0.05);
        }

        .pill.active {
            background: var(--text);
            color: var(--background);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
        }

        .pill.answered {
            border-color: rgba(255,255,255,0.2);
            color: var(--text);
        }

        .pill.flagged {
            border-color: var(--blue-border);
            color: var(--blue-light);
        }

        .question-card {
            display: flex;
            flex-direction: column;
            gap: 32px;
        }

        .question-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .q-badge {
            background: var(--blue-dim);
            color: var(--blue-light);
            border: 1px solid var(--blue-border);
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            padding: 4px 12px;
            border-radius: 99px;
        }

        .flag-btn {
            background: transparent;
            border: none;
            color: rgba(255,255,255,0.4);
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }

        .flag-btn.flagged {
            color: var(--blue-light);
        }

        .question-text {
            font-size: 20px;
            font-weight: 500;
            line-height: 1.5;
        }

        .options-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }

        .option-btn {
            width: 100%;
            padding: 20px;
            text-align: left;
            font-size: 13px;
            font-weight: 700;
            background: transparent;
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 20px;
            color: var(--text-muted);
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .option-btn:hover {
            background: rgba(255,255,255,0.05);
            color: var(--text);
        }

        .option-letter {
            width: 20px;
            height: 20px;
            border-radius: 8px;
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            font-size: 9px;
            font-weight: 900;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted);
        }

        .option-btn.selected {
            background: var(--blue-dim);
            color: var(--blue-light);
            border-color: rgba(37, 99, 235, 0.5);
            box-shadow: 0 0 20px rgba(37, 99, 235, 0.1);
            transform: scale(1.01);
        }

        .option-btn.selected .option-letter {
            background: var(--blue);
            color: white;
            border-color: var(--blue);
        }

        /* Review modes */
        .option-btn.correct {
            background: var(--emerald-dim) !important;
            border-color: rgba(16, 185, 129, 0.5) !important;
            color: var(--emerald) !important;
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.15);
            transform: scale(1.01);
        }

        .option-btn.incorrect {
            background: var(--crimson-dim) !important;
            border-color: rgba(239, 68, 68, 0.5) !important;
            color: var(--crimson) !important;
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.15);
            transform: scale(1.01);
        }

        .explanation-box {
            background: rgba(37, 99, 235, 0.05);
            border: 1px solid rgba(37, 99, 235, 0.1);
            padding: 24px;
            border-radius: 24px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 16px;
        }

        .explanation-header {
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: var(--blue-light);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .explanation-text {
            font-size: 14px;
            line-height: 1.5;
            color: rgba(255,255,255,0.7);
        }

        .nav-footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 48px;
            padding-top: 32px;
            border-t: 1px solid rgba(255,255,255,0.05);
        }

        .nav-btn {
            background: rgba(255,255,255,0.03);
            border: 1px solid var(--border);
            padding: 12px 24px;
            border-radius: 12px;
            color: var(--text);
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            cursor: pointer;
            transition: all 0.2s;
        }

        .nav-btn:hover {
            background: rgba(255,255,255,0.08);
        }

        .nav-btn:disabled {
            opacity: 0.2;
            cursor: not-allowed;
        }

        .submit-btn {
            background: var(--blue);
            color: white;
            border: none;
            box-shadow: 0 0 15px rgba(37, 99, 235, 0.4);
        }

        .next-btn {
            background: var(--text);
            color: var(--background);
        }

        /* Submit Modal */
        .modal-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 50;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }

        .modal-card {
            max-width: 380px;
            width: 100%;
            background: #0b0b14;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 40px;
            padding: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 24px;
        }

        .modal-icon {
            width: 64px;
            height: 64px;
            border-radius: 20px;
            background: var(--blue-dim);
            color: var(--blue);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
        }

        .modal-title {
            font-size: 20px;
            font-weight: 700;
        }

        .modal-desc {
            font-size: 14px;
            color: rgba(255,255,255,0.6);
            line-height: 1.4;
        }

        .modal-actions {
            width: 100%;
            display: flex;
            gap: 12px;
        }

        .modal-btn {
            flex: 1;
            padding: 16px;
            border-radius: 16px;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            cursor: pointer;
        }

        .cancel-btn {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.05);
            color: var(--text);
        }

        .confirm-btn {
            background: var(--blue);
            color: white;
            border: none;
        }

        /* Verdict styling */
        .verdict-card {
            border-radius: 40px;
            background: rgba(255,255,255,0.01);
            border: 1px solid rgba(255,255,255,0.05);
            padding: 48px;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            margin-bottom: 24px;
        }

        .stat-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 32px;
            width: 100%;
            border-top: 1px solid rgba(255,255,255,0.05);
            border-bottom: 1px solid rgba(255,255,255,0.05);
            padding: 32px 0;
            margin: 32px 0;
        }

        .stat-value {
            font-size: 24px;
            font-weight: 900;
        }

        .stat-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            color: rgba(255,255,255,0.4);
            margin-top: 4px;
        }

        .remark-text {
            font-size: 14px;
            font-style: italic;
            line-height: 1.6;
            color: rgba(255,255,255,0.6);
            padding: 0 24px;
        }

        @keyframes pulse {
            from { opacity: 0.8; }
            to { opacity: 1; }
        }
    </style>
</head>
<body>
    <header>
        <div class="header-left">
            ${BRAND_LOGO_SVG}
            <div>
                <p class="study-mode-label">The Professor AI | Assessment</p>
                <h2>${safeTitle}</h2>
            </div>
        </div>
        <div class="timer-badge" id="timer">10:00</div>
    </header>

    <main id="quiz-view">
        <div class="question-pills" id="pills-container"></div>

        <div class="question-card">
            <div class="question-meta">
                <span class="q-badge" id="question-badge">Question 1 / 1</span>
                <button class="flag-btn" id="flag-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/></svg>
                    <span id="flag-text">Flag</span>
                </button>
            </div>

            <h3 class="question-text" id="question-text">Question Text</h3>

            <div class="options-grid" id="options-container"></div>

            <div class="explanation-box" id="explanation-container" style="display: none;">
                <div class="explanation-header">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                    <span>Explanation</span>
                </div>
                <p class="explanation-text" id="explanation-text">Explanation text goes here...</p>
            </div>

            <div class="nav-footer">
                <button class="nav-btn" id="prev-btn" disabled>Prev</button>
                <button class="nav-btn next-btn" id="next-btn">Next</button>
            </div>
        </div>
    </main>

    <main id="verdict-view" style="display: none;">
        <div class="verdict-card">
            <div class="modal-icon">🎓</div>
            <div class="verdict-title">Academic Rank</div>
            <div class="verdict-score" style="font-size: 80px;" id="verdict-score-pct">0%</div>
            
            <div class="stat-grid">
                <div>
                    <div class="stat-value" id="stat-correct">0</div>
                    <div class="stat-label">Correct</div>
                </div>
                <div>
                    <div class="stat-value" id="stat-incorrect">0</div>
                    <div class="stat-label">Incorrect</div>
                </div>
                <div>
                    <div class="stat-value" style="color: var(--blue-light);" id="stat-accuracy">0%</div>
                    <div class="stat-label">Accuracy</div>
                </div>
            </div>

            <p class="remark-text" id="remark-text">"Your grades have been consolidated by the Professor."</p>
        </div>

        <button class="primary-btn" id="review-btn">Review Answers</button>
        <button class="primary-btn" style="margin-top: 16px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); color: white;" onclick="window.location.reload();">Retake Quiz</button>
    </main>

    <div class="modal-overlay" id="submit-modal">
        <div class="modal-card">
            <div class="modal-icon">📝</div>
            <div class="modal-title">Submit Assessment?</div>
            <div class="modal-desc">Your responses will be graded and reviewed.</div>
            <div class="modal-actions">
                <button class="modal-btn cancel-btn" id="cancel-submit">Cancel</button>
                <button class="modal-btn confirm-btn" id="confirm-submit">Submit</button>
            </div>
        </div>
    </div>

    <script>
        const questions = ${JSON.stringify(quizQuestions)};
        const initialTimer = ${timerSeconds};

        let currentIndex = 0;
        const answers = {};
        const flags = new Set();
        let status = 'taking'; // taking, verdict, review
        let timeLeft = initialTimer;
        let timerInterval;

        const timerBadge = document.getElementById('timer');
        const pillsContainer = document.getElementById('pills-container');
        
        const questionBadge = document.getElementById('question-badge');
        const flagBtn = document.getElementById('flag-btn');
        const flagText = document.getElementById('flag-text');
        const questionText = document.getElementById('question-text');
        const optionsContainer = document.getElementById('options-container');
        
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');

        const quizView = document.getElementById('quiz-view');
        const verdictView = document.getElementById('verdict-view');
        const submitModal = document.getElementById('submit-modal');
        const cancelSubmit = document.getElementById('cancel-submit');
        const confirmSubmitBtn = document.getElementById('confirm-submit');

        const verdictScorePct = document.getElementById('verdict-score-pct');
        const statCorrect = document.getElementById('stat-correct');
        const statIncorrect = document.getElementById('stat-incorrect');
        const statAccuracy = document.getElementById('stat-accuracy');
        const remarkText = document.getElementById('remark-text');
        const reviewBtn = document.getElementById('review-btn');
        
        const explanationContainer = document.getElementById('explanation-container');
        const explanationText = document.getElementById('explanation-text');

        function startTimer() {
            if (initialTimer === 0) {
                timerBadge.style.display = 'none';
                return;
            }
            timerInterval = setInterval(() => {
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    submitAssessment();
                    return;
                }
                timeLeft--;
                updateTimerDisplay();
            }, 1000);
        }

        function updateTimerDisplay() {
            const m = Math.floor(timeLeft / 60);
            const s = timeLeft % 60;
            timerBadge.textContent = m + ':' + s.toString().padStart(2, '0');
            if (timeLeft < 60) {
                timerBadge.classList.add('urgent');
            } else {
                timerBadge.classList.remove('urgent');
            }
        }

        function renderPills() {
            pillsContainer.innerHTML = '';
            questions.forEach((_, idx) => {
                const button = document.createElement('button');
                button.className = 'pill';
                button.textContent = idx + 1;
                
                if (idx === currentIndex) {
                    button.classList.add('active');
                } else if (answers[idx] !== undefined) {
                    button.classList.add('answered');
                } else if (flags.has(idx)) {
                    button.classList.add('flagged');
                }

                button.addEventListener('click', () => {
                    currentIndex = idx;
                    renderQuestion();
                });
                pillsContainer.appendChild(button);
            });
        }

        function handleSelect(optionIndex) {
            if (status === 'review') return;
            answers[currentIndex] = optionIndex;
            renderPills();
            renderQuestion();
        }

        function toggleFlag() {
            if (flags.has(currentIndex)) {
                flags.delete(currentIndex);
            } else {
                flags.add(currentIndex);
            }
            renderPills();
            renderQuestion();
        }

        function renderQuestion() {
            const q = questions[currentIndex];
            questionBadge.textContent = 'Question ' + (currentIndex + 1) + ' / ' + questions.length;
            
            if (flags.has(currentIndex)) {
                flagBtn.classList.add('flagged');
                flagText.textContent = 'Flagged';
            } else {
                flagBtn.classList.remove('flagged');
                flagText.textContent = 'Flag';
            }

            questionText.textContent = q.question;
            optionsContainer.innerHTML = '';
            
            q.options.forEach((opt, idx) => {
                const button = document.createElement('button');
                button.className = 'option-btn';
                
                const letter = document.createElement('div');
                letter.className = 'option-letter';
                letter.textContent = String.fromCharCode(65 + idx);
                button.appendChild(letter);

                const span = document.createElement('span');
                span.textContent = opt;
                button.appendChild(span);

                const isSelected = answers[currentIndex] === idx;
                const isCorrect = q.correctIndex === idx;

                if (status === 'review') {
                    if (isCorrect) {
                        button.classList.add('correct');
                    } else if (isSelected) {
                        button.classList.add('incorrect');
                    }
                } else {
                    if (isSelected) {
                        button.classList.add('selected');
                    }
                }

                button.addEventListener('click', () => handleSelect(idx));
                optionsContainer.appendChild(button);
            });

            // Explanation box in review mode
            if (status === 'review') {
                explanationContainer.style.display = 'flex';
                explanationText.textContent = q.explanation || "No explanation provided.";
            } else {
                explanationContainer.style.display = 'none';
            }

            // Footer navigation
            prevBtn.disabled = currentIndex === 0;
            if (currentIndex === questions.length - 1 && status !== 'review') {
                nextBtn.textContent = 'Finish Exam';
                nextBtn.className = 'nav-btn submit-btn';
            } else {
                nextBtn.textContent = 'Next';
                nextBtn.className = 'nav-btn next-btn';
            }
        }

        function submitAssessment() {
            clearInterval(timerInterval);
            status = 'verdict';
            submitModal.style.display = 'none';
            quizView.style.display = 'none';
            verdictView.style.display = 'block';

            let score = 0;
            questions.forEach((q, i) => {
                if (answers[i] === q.correctIndex) score++;
            });

            const pct = Math.round((score / questions.length) * 100);
            verdictScorePct.textContent = pct + '%';
            statCorrect.textContent = score;
            statIncorrect.textContent = questions.length - score;
            statAccuracy.textContent = pct + '%';

            // Generate customized remark
            let remark = "You finished the assessment offline.";
            if (pct === 100) {
                remark = "Absolute genius. You have fully mastered this material.";
            } else if (pct >= 80) {
                remark = "Solid run. You've locked in the high-yield parts.";
            } else if (pct >= 50) {
                remark = "A passing run. Make sure to review flagged cards.";
            } else {
                remark = "Review required. Re-read summary and retake when ready.";
            }
            remarkText.textContent = '"' + remark + '"';
        }

        // Action events
        flagBtn.addEventListener('click', toggleFlag);
        
        prevBtn.addEventListener('click', () => {
            if (currentIndex > 0) {
                currentIndex--;
                renderQuestion();
                renderPills();
            }
        });

        nextBtn.addEventListener('click', () => {
            if (currentIndex < questions.length - 1) {
                currentIndex++;
                renderQuestion();
                renderPills();
            } else if (status === 'taking') {
                submitModal.style.display = 'flex';
            }
        });

        cancelSubmit.addEventListener('click', () => {
            submitModal.style.display = 'none';
        });

        confirmSubmitBtn.addEventListener('click', submitAssessment);

        reviewBtn.addEventListener('click', () => {
            status = 'review';
            verdictView.style.display = 'none';
            quizView.style.display = 'block';
            currentIndex = 0;
            renderPills();
            renderQuestion();
        });

        startTimer();
        renderPills();
        renderQuestion();
    </script>
</body>
</html>`;

    triggerDownload(`${safeTitle}_Assessment.html`, html);
}

export function downloadSummaryOffline(title: string, renderedHtml: string) {
    const safeTitle = escapeHtml(title);
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle} - Offline Study Guide</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap" rel="stylesheet">
    <style>
        :root {
            --background: #050508;
            --card: #0c0c16;
            --border: #1a1a2e;
            --blue: #2563eb;
            --blue-light: #60a5fa;
            --text: #ffffff;
            --text-muted: #8e8e9f;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: var(--background);
            color: var(--text);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow-x: hidden;
            padding-bottom: 80px;
        }

        header {
            width: 100%;
            max-width: 900px;
            padding: 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border);
        }

        .brand-logo {
            width: 32px;
            height: 32px;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .study-mode-label {
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            color: var(--blue-light);
            margin-bottom: 2px;
        }

        h1 {
            font-size: 14px;
            font-weight: 700;
            color: var(--text);
        }

        .offline-badge {
            font-size: 8px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.2em;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 4px 8px;
            border-radius: 99px;
            color: var(--text-muted);
        }

        main {
            flex: 1;
            width: 100%;
            max-width: 750px;
            padding: 40px 24px;
            font-family: 'Source Serif 4', Georgia, serif;
            font-size: 18px;
            line-height: 1.7;
            color: rgba(255, 255, 255, 0.9);
        }

        h2, h3, h4 {
            font-family: 'Inter', sans-serif;
            color: var(--text);
            margin-top: 1.8em;
            margin-bottom: 0.6em;
            font-weight: 800;
            line-height: 1.3;
        }

        h2 { font-size: 28px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
        h3 { font-size: 22px; }
        h4 { font-size: 18px; }

        p {
            margin-bottom: 1.4em;
        }

        ul, ol {
            margin-bottom: 1.4em;
            padding-left: 24px;
        }

        li {
            margin-bottom: 0.6em;
        }

        strong {
            color: #ffffff;
            font-weight: 700;
        }

        blockquote {
            border-left: 4px solid var(--blue);
            margin: 24px 0;
            padding: 8px 20px;
            background: rgba(255, 255, 255, 0.02);
            font-style: italic;
            border-radius: 0 8px 8px 0;
        }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 32px 0;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            border: 1px solid var(--border);
            border-radius: 12px;
            overflow: hidden;
        }

        th {
            background-color: rgba(255, 255, 255, 0.04);
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 12px 16px;
            border-bottom: 2px solid var(--border);
            border-right: 1px solid var(--border);
        }

        td {
            padding: 12px 16px;
            border-bottom: 1px solid var(--border);
            border-right: 1px solid var(--border);
            color: var(--text-muted);
        }

        tr:last-child td {
            border-bottom: none;
        }

        tr td:last-child, tr th:last-child {
            border-right: none;
        }

        tr:nth-child(even) {
            background-color: rgba(255, 255, 255, 0.01);
        }

        /* Code & Pre */
        code {
            font-family: monospace;
            background: rgba(255, 255, 255, 0.08);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 15px;
            color: var(--blue-light);
        }

        pre {
            background: #0c0c16;
            padding: 20px;
            border-radius: 12px;
            overflow-x: auto;
            border: 1px solid var(--border);
            margin: 24px 0;
        }

        pre code {
            background: transparent;
            color: var(--text);
            padding: 0;
            font-size: 14px;
        }

        .action-bar {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 12px;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 8px 16px;
            border-radius: 99px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            z-index: 100;
        }

        .btn {
            background: transparent;
            border: none;
            color: white;
            font-family: 'Inter', sans-serif;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            padding: 10px 20px;
            border-radius: 99px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        }

        .btn-primary {
            background: #ffffff;
            color: #000000;
        }

        .btn-primary:hover {
            opacity: 0.9;
        }

        .btn-secondary {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        @media print {
            .action-bar {
                display: none;
            }
            body {
                background: white;
                color: black;
            }
            main {
                color: #1a1a1a;
                max-width: 100%;
                padding: 0;
            }
            h2, h3, h4, strong {
                color: black;
            }
            h2 {
                border-bottom-color: #e2e8f0;
            }
            table, th, td, pre {
                border-color: #e2e8f0;
            }
            th {
                background-color: #f1f5f9;
                color: black;
            }
            td {
                color: #334155;
            }
            tr:nth-child(even) {
                background-color: #f8fafc;
            }
            code {
                background: #f1f5f9;
                color: #2563eb;
            }
            pre {
                background: #f8fafc;
                border-color: #e2e8f0;
            }
            pre code {
                color: #1a1a1a;
            }
        }
    </style>
</head>
<body>
    <header>
        <div class="header-left">
            ${BRAND_LOGO_SVG}
            <div>
                <p class="study-mode-label">The Professor AI | Study Guide</p>
                <h1>${safeTitle}</h1>
            </div>
        </div>
        <div class="offline-badge">Offline Active</div>
    </header>

    <main>
        ${renderedHtml}
    </main>

    <div class="action-bar">
        <button class="btn btn-primary" onclick="window.print();">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print / Save PDF
        </button>
        <button class="btn btn-secondary" onclick="window.close();">
            Close
        </button>
    </div>
</body>
</html>`;

    triggerDownload(`${safeTitle}_Summary.html`, html);
}

function triggerDownload(filename: string, text: string) {
    if (typeof window === "undefined") return;
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/html;charset=utf-8," + encodeURIComponent(text));
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
