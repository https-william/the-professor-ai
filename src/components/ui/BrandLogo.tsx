"use client";

import React from 'react';

export const BrandLogo: React.FC<{
    className?: string;
    size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}> = ({ className = "", size = "md" }) => {
    const sizeMap = {
        xxs: 12,
        xs: 14,
        sm: 24,
        md: 32,
        lg: 48,
        xl: 80,
    };
    const px = sizeMap[size as keyof typeof sizeMap] || sizeMap.md;

    return (
        <svg 
            width={px} 
            height={px} 
            className={className} 
            viewBox="0 0 816 816" 
            xmlns="http://www.w3.org/2000/svg"
        >
            <path fill="#07092b" d="M201 0h417q21 0 41 4l2 1a178 178 0 0 1 53 21l2 1 2 1v2l3 1 12 7 4 3v2l2 1 8 5 3 3 4 6 4 2q13 13 24 29l1 1c3 5 3 5 3 8h2q16 28 24 59v2a168 168 0 0 1 4 47v412q0 18-3 34l-1 3-1 8-1 2a232 232 0 0 1-22 53h-2l-1 3-7 12-3 4h-2l-1 2c-7 13-21 26-33 34h-2v2l-8 6-2 1-2 2-2 1-5 1v2l-46 20-11 2-1 2c-20 7-45 5-66 4H198q-21 0-41-4l-3-1-7-2-4-1q-19-6-39-17l-6-3v-2h-2q-6-2-10-6l-2-1-5-4v-2l-2-1q-9-6-17-14v-2h-2v-2l-2-1q-4-2-6-6l-2-1-5-7v-2h-2l-5-7-1-2-5-10h-2q-16-28-24-59v-2a168 168 0 0 1-4-47V198q0-20 4-41l1-2a190 190 0 0 1 23-57h2v-2q2-6 6-10l1-2 4-5h2l1-2 5-8 3-3 6-4 2-4h2l1-2 7-8 2-1 7-4v-2l7-5 2-1 10-5v-2l15-8q21-10 44-16h3q20-5 41-4"/>
            <path fill="#eee" d="m444 214 39 25 5 2v2l3 1q6 2 11 6l4 3 3 2 10 6 2 1 47 29 2 2 80 50c24 14 24 14 28 25q4 13-3 24l-5 6h-2v2l-4 1v2l-5 3-15 9-2 1-19 13-2 1-2 1q-6 3-12 2-5-3-8-8-2-7 0-12 8-9 20-15l12-8 3-1 3-2 2-1 4-6v-9l-3-1v-2l-2-1q-6-1-10-6l-3-1-25-16-29-18-52-32-45-29-4-2-15-9-17-11-3-1-2-2-4-2-2-2-2-1q-9-4-20-1l-15 8-11 7-2 1-24 15-5 2v2l-3 1-14 9-7 3v2l-2 1-16 10-5 1v2l-40 25-3 2-26 16-11 6-10 7-4 1v2l-2 1-11 7-5 3-5 4v7l1 5 25 16 42 26 2 1 10 7 2 1 11 6v2l2 1 8 5 5 2 13 9 39 23v2l3 1 8 5 5 3 8 5 2 1 13 8 3 2 4 3q13 11 29 9 10-3 17-9l5-3 3-2 7-4 2-2 82-51c11-6 11-6 18-4l7 6q2 7 0 13-9 10-22 16h-2v2l-2 1-30 18-2 1-2 2-2 1-38 23-6 3v2l-2 1-12 7q-17 10-35 8-9-1-16-6v-2h-2q-8-4-17-10l-9-6-4-2-45-29-7-4-13-8-18-11c-8-6-8-6-16-9v97c0 14 0 14 6 26l8 5 9 4a115 115 0 0 0 34 10l19 4h2q38 5 75 5h3q40 1 81-6l4-1 43-11c9-3 21-7 25-16l1-8v-10l1-103 3 3 2 1 5 6 2 3 1 2 2 2q6 9 5 20v63c0 25 0 25-6 34l-1 2q-7 10-18 13v2q-21 11-44 14l-4 2-23 4a386 386 0 0 1-228-20l-3-1q-11-5-18-15v-2h-2q-8-20-5-41v-94c0-6 0-6-3-11l-8-5-23-15-5-2-14-9-16-10q-14-6-20-20-2-13 3-24 9-9 20-16l62-39 21-13 77-47 47-30c23-15 42-19 66-3"/>
            <path fill="#2464a2" d="m450 320 11 8c22 16 22 16 26 29q1 12-2 23h3q12 2 23 6l9 4 14 5v2l3 1 10 5 2 1 12 8 6 4 8 7 2 2 2 1v2h2v2l2 1 5 5 2 2 2 2 3 4 2 1 2 3 4 5 2 2 1 2 1 2c14 21 14 21 14 25h2l17 42 1 2 2 7v2l3 12h5v2h4q7 2 12 8 8 10 6 22l-2 7-1 2q-5 10-15 13l-7 1h-3q-10 1-18-8l-2-2q-7-8-6-19 2-12 9-19l2-1q1-7-2-12l-6-19c-5-11-5-11-5-16h-2l-1-2q-1-7-6-14l-1-3-6-9-3-6-9-12-4-5q-24-31-61-48l-3-1-13-5v-2l-16-2-9-4h-3l-1 4-1 5-1 2-5 14-1 5h-2v2l-5 8h-2v2c-12 12-34 10-50 10-39-1-39-1-47-9l-3-4-3-2q-4-6-5-13l-5-14-6-18-1-4-2-9-1-2q-2-14 5-26 6-8 15-14l7-6 5-2 8-5 4-4 4-2v-2l6-2v-2l2-1 3-1 3-1 3-2c18-4 32 7 46 18"/>
            <path fill="#ddb238" d="M660 553q10 7 13 18 1 9-2 17l-1 2q-5 10-15 13l-7 1h-3q-10 1-18-8l-2-2q-7-8-6-19 2-12 9-19 15-10 32-3"/>
            <path fill="#b8a260" d="M660 553q10 7 13 18 1 9-2 17l-1 2q-5 10-15 13l-7 1h-3q-10 1-18-8l-2-2q-7-8-6-19 2-12 9-19 15-10 32-3m-34 8q-6 11-4 23 2 6 6 11h2l1 3q10 7 22 3 6-2 12-7l1-4h2v-5l2-1-2-20h-2l-1-2-5-6h-4l-1-2q-17-6-29 7"/>
            <path fill="#295a8d" d="M476 403q2 5-1 10l-1 3-1 3-2 6h-2v2l-5 8h-2v2c-12 12-34 10-50 10l-34-2-1-3h2l41 1 32-1v-3h2l1-2q3-4 7-3v-2h2l5-14 4-7 2-6z"/>
            <path fill="#bcbec4" d="M232 445h6l1 8v33l-2 86V451q-2-4-5-6"/>
            <path fill="#295a8c" d="M507 399h2v2l13 2v2l6-2v4l6 3v2h2l8 4 3 1 2 2 2 1 5 5 2 1q4 2 6 6l-1 2-2-2q-10-8-22-15l-3-2q-13-8-28-12v-2l-16-2-4-1-1-2q11-3 20 3"/>
            <path fill="#c5c6cc" d="M585 481q4 3 4 8v25l-1 70h-1l-1-18v-2l-1-76 2-3h-2z"/>
            <path fill="#d1d2d7" d="M395 630q6 2 6 4h53v1l-24 1h-3l-80-3v-1h18l4-1 5 1v1h5v-1l16-1z"/>
            <path fill="#dbdcdf" d="m339 274-6 4-2 1-7 3v2l-2 1-16 10-5 1v2l-11 6v-3l2-1v-3h5l2-3h4l1-3 7-1 1-2q1-3 4-4l3-1-1-6 6 1h2l1-1h5l1-3z"/>
            <path fill="#d7d8dc" d="m519 606-11 3-8 2-7 1h-2l2 2-8 1-50 1v-1h2a418 418 0 0 0 82-9"/>
            <path fill="#d0d1d6" d="m569 460 13 15 3 4h-5l-2-1v-4l-5-2-2 1-1-3v39h-1z"/>
            <path fill="#29598b" d="M640 534h2l4 15h5v1h-3l-3 1h-4l-7 3h-3l-1-9q4 3 8 1l3-1z"/>
            <path fill="#29598a" d="M577 426h2v2h2v2l2 1 5 5 2 2 2 2 3 4 2 1 2 3 6 7 2 3 1 2-2 4c-5-6-5-6-5-8h-2l-1-4-5-8-3-1v-2h-2l-4-3-2-3-4-5z"/>
            <path fill="#295a8d" d="M486 360h1q1 10-2 20h3l25 7 3 1 2 1v1q-8 0-16-4l-7-1-4-1h-3q-5-1-5-3-3-8 2-14z"/>
            <path fill="#295889" d="m528 394 6 1v2l3 1 10 5 2 1 12 8 6 4q4 2 5 6l-4-1v-2h-4v-2l-2-1-8-5v-2l-3-1-4-1-1-3h-2l-6-3-4-1-4-1z"/>
            <path fill="#e1e2e5" d="m408 545 2 1 5 1h5l1-2 2 1q4 1 7-1l3 2q-18 8-37 1v-1h11z"/>
            <path fill="#dadbdf" d="m512 257 19 11 9 6 1 1v4l-5-2v-2l-3-1-1-3h-3l-5-1-1-2-3 1-2-6-5-1z"/>
            <path fill="#e1e2e5" d="m198 357 1 2 2 1-12 8-5 4v7q0 4 3 7l-3 1-3-2v-3l-2-1 2-1 1-4v-4l-2-1q5-7 13-10z"/>
            <path fill="#e4e5e7" d="m585 303 20 12 2 1 5 4-4 2-1-3h-3v-2q-3-3-8-1l-2 1 1-3-4-3 1-2-5-2v-2h-2z"/>
            <path fill="#dadbdf" d="m541 448 1 2-2 2-3 4-5 2-2 2-6 1 2 5h-4v-2l-5-1 13-9 2-1z"/>
            <path fill="#dbdde0" d="m484 240 4 1v2l3 1 9 5 4 2 2 2-3 5-4-5-3-1v-2l-9-1v-2h2q-2-3-5-4z"/>
            <path fill="#d4d5d9" d="M552 593h2l-1 5q-3 2-8 3v3h-4l-14-1 8-4 3-1 3-1 8-2z"/>
            <path fill="#295889" d="M626 494q4 3 5 8l5 12q6 9 5 17l-1 2-1-2-5-11-4-12-3-10z"/>
            <path fill="#d8dadd" d="m626 395-1 4h-2l-1 3-3 2q-3 1-5 4l-6 1q-3 0-5 3l-2-1 15-11 6-3z"/>
            <path fill="#dedfe2" d="M531 480h9l-4 2v2l-2 1-22 13-1-4q3-2 8-2v-2q5-5 12-6h2z"/>
            <path fill="#dcdde0" d="M648 342c19 10 19 10 21 14h-8l-2-2-3-1-1-1q-4-3-8-4z"/>
            <path fill="#e0e1e4" d="M582 332h6l2 4h4v3l6-2 2 2-1 2 3 1 7 7-7-2-3-2-3-2-7-4-3-2z"/>
            <path fill="#29598b" d="M462 330q8 4 15 10l3 2q6 7 6 16l-1 2q-4-5-5-11l-1-2v-2h-2l-1-2q-3-4-7-5l-3-3-2-2-2-1z"/>
            <path fill="#d8dadd" d="m365 225 2 1v3l-2 1v2h-4l-1 2q-3 4-7 4h-3l-3 1-1-2 9-6 3-2 3-1 2-2z"/>
            <path fill="#295889" d="M615 504q11 12 13 29v6l-3-7-6-16-2-8h-2z"/>
            <path fill="#dbdce0" d="m458 224 10 5 7 5 2 1v2l-6-2-1 2-5-2 1-3-6-1z"/>
            <path fill="#e0e1e4" d="m154 392 5 1 1 3 4 2 2 2 5 1 2 7q-5-1-11-6l-2-1-2-2-2-2-3-4z"/>
            <path fill="#dedfe2" d="m344 238 2 1-1 4-5 2-2 2q-5 5-13 6v-3l6-4z"/>
            <path fill="#dcdde0" d="m581 591 3 1q-6 12-18 17h-2v2h-3l-1-4q6-3 11-3v-2l2-1 3-4 3-4h2zM569 575h2l-1 15h-12l2-1q7-5 9-14"/>
            <path fill="#dedfe2" d="m430 207 12 6 3 2 2 1-1 2-5 1h-5l-1-2v-2l-1-2-4-4z"/>
            <path fill="#d6d8db" d="m216 404 25 15-2 2q-5 0-11-4v-2l-6-3v-3l-4-1v-2h-2z"/>
            <path fill="#e2e3e5" d="m277 280 2 1-5 9h-9l-2 4-5 1v-3l4-3 3-2 2-1 3-2z"/>
            <path fill="#295686" d="M420 302v1l-16 1-1 3-8 2v2l-8 2v-2l6-2v-2l2-1 3-1 3-1 3-2zm-35 11 2 1v2l-5 1v-2z"/>
            <path fill="#dadbde" d="M507 496h2l1 3-7 5-2 1-14 8q1-4 4-7l16-8z"/>
            <path fill="#d9dbde" d="m339 482 5 1v2l3 1 8 5 5 3-2 1-1 2-1-4h-9l-1-3h-3l-1-5-3 1z"/>
            <path fill="#dedfe2" d="m619 324 7 4 2 1q5 2 8 6l-7 1-4-1-2-5h-4z"/>
            <path fill="#dadbde" d="m354 258 2 1h6c-10 8-10 8-14 8v2l-4 1-1-3 3-3q4-1 5-5z"/>
            <path fill="#295889" d="M603 480q5 1 7 5l2 4 1 2q3 5 2 12-3-1-4-6l-2-2z"/>
            <path fill="#d5d6da" d="M199 330v5q-3 3-8 2v2l2 1c-5 2-5 2-9 1l-2-1 10-7 3-2z"/>
            <path fill="#dedfe2" d="m246 331-11 8-2 2-7 1-1-3h2l1-2 4-1 6-2 1-3z"/>
            <path fill="#d6d7db" d="m322 252 2 1-2 1-3 3-1 3-1 2-5 1v2h-9l11-8z"/>
            <path fill="#d9dbde" d="M459 527h5q-4 5-10 6v2l-9 4-3-5 3-1 1 1 2-1 6-1v-4h2v2h2z"/>
            <path fill="#dbdce0" d="M559 466q-7 9-18 14l-1-3 2-1q5-1 5-5 5-6 12-5"/>
            <path fill="#d6d8dc" d="m262 586 2 1 2 1 2 2 7 3 6 3 3 1 2 1v1l-12-3v-2l-4 3-3-2 1-4-4 1v-2h-2z"/>
            <path fill="#295889" d="m356 422 6 7 3 2 2 2v3l2 1v2l3 1 4 3-4-1-2-1q-5-2-8-6l-3-3q-3-4-3-10"/>
            <path fill="#d5d6d9" d="m344 514 3 1 3-1v5h3q7 1 10 5l1 4-13-7-3-2-5-3z"/>
            <path fill="#dadbde" d="m174 345-3 9h-2v2h-6l-1-4 5-3 3-2z"/>
            <path fill="#dfe0e3" d="m564 290 17 10-2 3h-2v-3h-2v2l-4-1v-2l-1-2-2-1-3-1zM393 239l-8 7-3 1-8 4v-5l4-1 7-4q3-2 8-2"/>
            <path fill="#295b8e" d="M346 344c1 4 1 4-1 8l-1 2-1 2h-2q0 9 2 18v8q-6-11-4-23 1-8 7-15"/>
            <path fill="#d7d8dc" d="m544 304 1 2 5 2 2 2h2l2 2 2 1v4l-9-5-3-1-7-6z"/>
            <path fill="#c9cbd0" d="m506 625 1 1h9v1l-4 1h-5l-3 1-15 3-6-1 9-1 1-3q6-2 13-2"/>
            <path fill="#295a8d" d="m583 452 4 3 2 1 3 5 2 2 5 8 2 3 1 3-1 2-2-3-14-20z"/>
            <path fill="#d2d3d8" d="m156 357-1 5h-2l1 3-2 3v3l2 1-2 2q-3 4-3 10h-1q-3-13 5-24z"/>
            <path fill="#dddee1" d="m390 513 2 1q7 5 14 7l-3 1 1 4-6-2v-2h-2l-2-3-5-2z"/>
            <path fill="#d5d6da" d="M447 239v3h-2l1 4h7l1 6-12-6-2-1-4-3 6-1z"/>
            <path fill="#cecfd4" d="m454 252 11 2 1 3 4 2 1-1q3 2 2 6l-14-8-5-3z"/>
            <path fill="#c2c3ca" d="m305 604 11 2 22 4v1l-21-2h-5l-6-1z"/>
            <path fill="#29598b" d="m613 470 6 8 1 2 1 4h2c3 7 3 7 2 10l-3-5-2-3-3-5-3-3z"/>
            <path fill="#d5d7da" d="m193 414 2 1v5h4v3l3 1-1 2-17-10v-1c6 0 6 0 9 2z"/>
            <path fill="#e0e1e4" d="m281 306 3 2-9 6-3 2-3 1-2 2-4 1q3-6 8-9l7-2 3-1z"/>
            <path fill="#cfd1d5" d="m263 605 2 1-1 2h2l3 3 1 2 2-1 6 1 1 4-5-1-2-1-7-4-4-2-3-1 2-1z"/>
            <path fill="#dbdcdf" d="M306 461q6 2 11 6l3 2 2 1q-4 3-9 2l2-1v-2l-2-1-8-4z"/>
            <path fill="#dcdde0" d="m263 460 5 2v3l5 1 1 3-1 2-10-5-3-2-2-1 5-2z"/>
            <path fill="#d9dade" d="M249 425q9 4 16 9l-1 2-8-1-2-2v-2h-2l-1-4h-2z"/>
            <path fill="#294e79" d="M507 399h2l1 4h-2v-2l-16-2-4-1-1-2q11-3 20 3"/>
            <path fill="#dcdee1" d="M274 441h3v2l2 1q6 2 10 6l-1 3-7-2-1-3h-2l-1-3-3-2z"/>
            <path fill="#d2d4d8" d="m433 236 3 5-9-4q-6-5-15-5v-1q12-3 21 5"/>
            <path fill="#d9dbde" d="M212 347h5v3l-4 3-2 1-4 1v2l-6 2-1-3 5-1 1-3 5-3z"/>
            <path fill="#d8d9dc" d="m229 310 2 1-5 4-2 3h-2l-1 3-1 2-5-1 1-4 8-5z"/>
            <path fill="#c9cbd0" d="m329 625 2 3 6 2-3 1h-3l-3-1-3-1-7-1v-1l4-2h7"/>
            <path fill="#cfd0d5" d="M507 285h7v2l5 2v2l3-1v2l2 4-17-10z"/>
            <path fill="#d2d3d7" d="m394 207 2 1-1 1-2 2-2 1-4 6h-5l-1-3 6-4 2-1z"/>
            <path fill="#c0c2c8" d="m368 631 6 1v1l6 1v1l-23-1h-3l-7-1v-1h18z"/>
            <path fill="#d7d8dc" d="m494 275 3 1 5 1 4 5 1 3-10-5-3-2-2-1z"/>
            <path fill="#d4d6da" d="m212 430 4 1v3h7l-1 4h3l1 3-14-8-2-1z"/>
            <path fill="#babcc3" d="m519 606-11 3-8 2h-11v-1l16-3 4-1 3-1z"/>
            <path fill="#dfe0e3" d="m480 513 5 1-15 10-2-3h3l2-4h5z"/>
            <path fill="#295b8e" d="M346 344c1 4 1 4-1 8l-1 2-1 2h-2q0 9 2 18v8q-6-11-4-23 1-8 7-15"/>
            <path fill="#cfd1d5" d="m629 359 2 1v2h3q4 0 7 2l1 7-2-1v-2l-2-1q-5-2-11-6z"/>
            <path fill="#cecfd4" d="m556 610 5 1-8 5-4 2h-6 2v-2h2v-3h8z"/>
            <path fill="#464a5c" d="m645 546 1 3h5v1h-3l-3 1h-4l-7 3h-3v-3c9-3 9-3 14-3z"/>
            <path fill="#d9dadd" d="m373 503 14 8v2l-12-4v-4h-2z"/>
            <path fill="#dfe0e3" d="m187 386 4 2 3 2q3 1 4 5l-8-1q-3-3-3-8"/>
            <path fill="#d7d8dc" d="M643 380h1l-1 8h-2v2l-7 2-2-2 2-1 2-2 3-1z"/>
            <path fill="#d8d9dd" d="m288 478 5 1h2l2 1v6q-5-2-11-6z"/>
            <path fill="#d1d2d7" d="m560 316 3 2 2-1q4 1 6 5l1 4-9-5-2-2-2-1zM473 264l8 2h5l-1 5h3v2l-10-5-3-2-2-1z"/>
            <path fill="#d5d6da" d="m439 511 2 1-2 6-8 1 1-4z"/>
            <path fill="#d5d7db" d="m576 468 9 12-6-1v-2q0-3-4-5z"/>
            <path fill="#ccced2" d="m455 501 2 1-7 5 1 4-4 2v-3h-5q3-4 8-6l3-2z"/>
            <path fill="#d1d2d7" d="m664 402-9 6-3 2-2 1q1-5 5-8z"/>
            <path fill="#285b8e" d="m421 303 11 4 3 2 4 4-2-1-9-3v-2h-5z"/>
            <path fill="#d5d6da" d="m531 617 2 1 8 1q-4 4-12 4h-2l1-4h3z"/>
            <path fill="#d7d8dc" d="m492 479 1 3-5 4h-7c7-7 7-7 11-7"/>
            <path fill="#c7c8cd" d="m300 619 4 3-1 2 2 1-5-1h-3l-5-3q3-2 8-2"/>
            <path fill="#d7d9dd" d="m600 312 12 7-2 3-3-1v-2h-3v-2l-3-1z"/>
            <path fill="#cfd0d5" d="m408 545 2 1-2 1zm-12 2h8l5 2v2q-7 0-13-3z"/>
            <path fill="#d5d7db" d="m322 498 4 2v2l4 2v3l-5-3-3-1-4-4 4 1z"/>
            <path fill="#dedfe2" d="m642 415-9 7-3-1q5-7 12-6"/>
            <path fill="#d8d9dd" d="M336 611h7l7 2-3 1-4 2z"/>
            <path fill="#cfd0d5" d="M333 506c7 2 7 2 9 6l1 3-12-7z"/>
            <path fill="#dcdde1" d="m252 323 5 1-5 4-2 2-2 1-3-1 1-3 6-2z"/>
            <path fill="#d6d8db" d="M549 281c7 2 7 2 9 5l-1 4-5-4v-3l-3 1z"/>
            <path fill="#d9dade" d="m351 613 19 1v1h-3l-5 2-7-1-2-1-2-1z"/>
            <path fill="#d3d4d9" d="M239 580q5 1 5 4l-1 9-2-4-1-2z"/>
            <path fill="#c9cacf" d="m378 533 4 3 2 5q-5-2-11-6 2-2 5-2"/>
            <path fill="#cfd1d5" d="M598 416h1v5l5 2v5h-3q-3-5-3-12"/>
            <path fill="#d5d6da" d="m388 539 2 5h2v-3h2l2 6-7-2v-2l-4-1z"/>
            <path fill="#d3d4d9" d="m627 422 3 2-6 4-2 1-5 3-2-1 1-3 7-1 1-3z"/>
            <path fill="#cdcfd3" d="m198 357 1 2 2 1-9 6-1-3z"/>
            <path fill="#c9cacf" d="M582 332h6l2 4h4l1 4-13-7z"/>
            <path fill="#dedfe2" d="M519 604h6l-4 7-1-1-4-3 3-1z"/>
            <path fill="#cdced3" d="m506 469 2 1-3 5h-2l-1 2-5-1c5-6 5-6 9-7"/>
            <path fill="#dcdde0" d="M191 337v2l2 1c-5 2-5 2-9 1l-2-1q4-4 9-3"/>
            <path fill="#d7d8db" d="M530 297q4 0 7 3l-1 4-8-5z"/>
            <path fill="#d7d8dc" d="m396 232 2 1h3l1-1h6l-7 4-2 1-4 1z"/>
            <path fill="#ac9961" d="m668 591 1 2-5 5-3 2-5 2q2-5 7-8l3-2z"/>
            <path fill="#dedfe2" d="m324 472 8 4-2 3-6-2z"/>
            <path fill="#cecfd3" d="M182 375h1v2l1 2v3l3 4-3 1-3-2v-3l-2-1 2-1z"/>
            <path fill="#d9dade" d="m440 538 5 1q-4 5-10 6l-1-2h2l3-3z"/>
            <path fill="#2a5787" d="m347 395 2 1 1 7h2l1 6-2 1z"/>
            <path fill="#caccd0" d="m171 401 2 7-10-5q3-2 8-2"/>
            <path fill="#d1d2d6" d="M611 350h4l3 1 4 2-1 3q-6-1-10-6"/>
            <path fill="#d2d3d7" d="m213 320 2 1-4 5h-4l-2-1 4-3 2-1z"/>
            <path fill="#d9dade" d="m281 306 3 2-5 4-3 1-5 2v-2h2v-2l8-3z"/>
            <path fill="#e3e4e6" d="M304 291h4q0 3-4 5h-7l2-2h4z"/>
            <path fill="#c6c8cd" d="M444 246h9l1 6-10-5z"/>
            <path fill="#dfe0e3" d="M519 492v2l-8 4v-5z"/>
            <path fill="#dedfe2" d="m585 481 3 3v12c-3-5-3-5-3-8l2-3h-2z"/>
            <path fill="#d5d6da" d="m179 408 2 2 3 1v4q-5-1-9-6z"/>
            <path fill="#295686" d="M373 322h2v2h-2l-1 3-6 3-2-1q2-4 7-5z"/>
            <path fill="#cbcdd1" d="m248 298 2 1-3 4h-2v2l-4 1-1-3 4-3 2-1z"/>
            <path fill="#d2d3d8" d="m339 274-12 7 1-4h4l1-3z"/>
            <path fill="#d8d9dd" d="M369 251h5l-9 7h-2l-1-3 7-1z"/>
            <path fill="#295b8e" d="M343 382h2q3 6 2 13l-3-8-1-3z"/>
            <path fill="#29598b" d="M440 314q6 2 10 7h-5v-2l-3-1z"/>
            <path fill="#d0d1d5" d="m344 238 2 1-1 4-5 2v-2l-2-1z"/>
            <path fill="#c1c2c9" d="m277 280 2 1-11 7-2-1 5-4 3-2z"/>
            <path fill="#d3d4d8" d="m293 270 2 1-2 7-2-4-4 1z"/>
            <path fill="#d8d9dc" d="M494 271h4v3l-4-1zm-3 1 3 1-2 1v2l-4-2z"/>
            <path fill="#d0d2d6" d="m512 257 9 5h-8z"/>
            <path fill="#d7d8dc" d="m467 258 3 1 1-1q3 2 2 6l-5-2z"/>
            <path fill="#dcdde0" d="m451 219 6 3-1 3h-5z"/>
            <path fill="#bcbec4" d="M305 604c7 1 7 1 9 3l-7 2z"/>
            <path fill="#e0e1e4" d="m243 590 3 1v3l3 1-2 4c-4-6-4-6-4-9"/>
            <path fill="#c5c7cc" d="m429 517 2 1-7 6-5-2 7-3z"/>
            <path fill="#d1d2d6" d="M531 480h9l-4 2v2l-3 1z"/>
            <path fill="#c4c5cb" d="M601 344h6l4 5q-5 0-10-4z"/>
            <path fill="#c9cacf" d="m381 216-2 5-4 1-2-2z"/>
            <path fill="#e0e1e4" d="m553 448 6 3v2h-5l-2-3z"/>
            <path fill="#29517e" d="m356 422 4 4v6c-4-4-4-4-4-8z"/>
            <path fill="#cbcdd1" d="m497 276 3 1-1 3-6-2-1-2z"/>
            <path fill="#e1e2e4" d="m365 225 2 1v3l-2 1v2l-4-1z"/>
            <path fill="#c9cad0" d="M364 528h5l4 5q-5 0-9-4z"/>
            <path fill="#d2d3d8" d="m523 487 4 2-8 4v-3z"/>
            <path fill="#e1e2e5" d="m511 466 2 1-4 2v3l3 1h-7z"/>
            <path fill="#d5d6da" d="M226 441h9q-2 4-5 4z"/>
            <path fill="#dadcdf" d="m200 394 7 4-1 2-5-1v-2l-2-1z"/>
            <path fill="#d8d9dd" d="m564 290 8 4-4 2-3-1z"/>
            <path fill="#c9cad0" d="m506 625 1 1h9v1l-4 1h-5l-3 1-15 3-6-1 9-1 1-3q6-2 13-2"/>
            <path fill="#295a8d" d="m583 452 4 3 2 1 3 5 2 2 5 8 2 3 1 3-1 2-2-3-14-20z"/>
            <path fill="#d2d3d8" d="m156 357-1 5h-2l1 3-2 3v3l2 1-2 2q-3 4-3 10h-1q-3-13 5-24z"/>
            <path fill="#dddee1" d="m390 513 2 1q7 5 14 7l-3 1 1 4-6-2v-2h-2l-2-3-5-2z"/>
            <path fill="#d5d6da" d="M447 239v3h-2l1 4h7l1 6-12-6-2-1-4-3 6-1z"/>
            <path fill="#cecfd4" d="m454 252 11 2 1 3 4 2 1-1q3 2 2 6l-14-8-5-3z"/>
            <path fill="#c2c3ca" d="m305 604 11 2 22 4v1l-21-2h-5l-6-1z"/>
            <path fill="#29598b" d="m613 470 6 8 1 2 1 4h2c3 7 3 7 2 10l-3-5-2-3-3-5-3-3z"/>
            <path fill="#d5d7da" d="m193 414 2 1v5h4v3l3 1-1 2-17-10v-1c6 0 6 0 9 2z"/>
            <path fill="#e0e1e4" d="m281 306 3 2-9 6-3 2-3 1-2 2-4 1q3-6 8-9l7-2 3-1z"/>
            <path fill="#cfd1d5" d="m263 605 2 1-1 2h2l3 3 1 2 2-1 6 1 1 4-5-1-2-1-7-4-4-2-3-1 2-1z"/>
            <path fill="#dbdcdf" d="M306 461q6 2 11 6l3 2 2 1q-4 3-9 2l2-1v-2l-2-1-8-4z"/>
            <path fill="#dcdde0" d="m263 460 5 2v3l5 1 1 3-1 2-10-5-3-2-2-1 5-2z"/>
            <path fill="#d9dade" d="M249 425q9 4 16 9l-1 2-8-1-2-2v-2h-2l-1-4h-2z"/>
            <path fill="#294e79" d="M507 399h2v2l13 2v2l6-2v4l6 3v2h2l8 4 3 1 2 2 2 1 5 5 2 1q4 2 6 6l-1 2-2-2q-10-8-22-15l-3-2q-13-8-28-12v-2l-16-2-4-1-1-2q11-3 20 3"/>
            <path fill="#dcdee1" d="M274 441h3v2l2 1q6 2 10 6l-1 3-7-2-1-3h-2l-1-3-3-2z"/>
            <path fill="#d2d4d8" d="m433 236 3 5-9-4q-6-5-15-5v-1q12-3 21 5"/>
            <path fill="#d9dbde" d="M212 347h5v3l-4 3-2 1-4 1v2l-6 2-1-3 5-1 1-3 5-3z"/>
            <path fill="#d8d9dc" d="m229 310 2 1-5 4-2 3h-2l-1 3-1 2-5-1 1-4 8-5z"/>
            <path fill="#c9cbd0" d="m329 625 2 3 6 2-3 1h-3l-3-1-3-1-7-1v-1l4-2h7"/>
            <path fill="#cfd0d5" d="M507 285h7v2l5 2v2l3-1v2l2 4-17-10z"/>
            <path fill="#d2d3d7" d="m394 207 2 1-1 1-2 2-2 1-4 6h-5l-1-3 6-4 2-1z"/>
            <path fill="#c0c2c8" d="m368 631 6 1v1l6 1v1l-23-1h-3l-7-1v-1h18z"/>
            <path fill="#d7d8dc" d="m494 275 3 1 5 1 4 5 1 3-10-5-3-2-2-1z"/>
            <path fill="#d4d6da" d="m212 430 4 1v3h7l-1 4h3l1 3-14-8-2-1z"/>
            <path fill="#babcc3" d="m519 606-11 3-8 2h-11v-1l16-3 4-1 3-1z"/>
            <path fill="#dfe0e3" d="m480 513 5 1-15 10-2-3h3l2-4h5z"/>
            <path fill="#295b8e" d="M346 344c1 4 1 4-1 8l-1 2-1 2h-2q0 9 2 18v8q-6-11-4-23 1-8 7-15"/>
            <path fill="#cfd1d5" d="m629 359 2 1v2h3q4 0 7 2l1 7-2-1v-2l-2-1q-5-2-11-6z"/>
            <path fill="#cecfd4" d="m556 610 5 1-8 5-4 2h-6 2v-2h2v-3h8z"/>
            <path fill="#464a5c" d="m645 546 1 3h5v1h-3l-3 1h-4l-7 3h-3v-3c9-3 9-3 14-3z"/>
            <path fill="#d9dadd" d="m373 503 14 8v2l-12-4v-4h-2z"/>
            <path fill="#dfe0e3" d="m187 386 4 2 3 2q3 1 4 5l-8-1q-3-3-3-8"/>
            <path fill="#d7d8dc" d="M643 380h1l-1 8h-2v2l-7 2-2-2 2-1 2-2 3-1z"/>
            <path fill="#d8d9dd" d="m288 478 5 1h2l2 1v6q-5-2-11-6z"/>
            <path fill="#d1d2d7" d="m560 316 3 2-2-1q4 1 6 5l1 4-9-5-2-2-2-1zM473 264l8 2h5l-1 5h3v2l-10-5-3-2-2-1z"/>
            <path fill="#d5d6da" d="m439 511 2 1-2 6-8 1 1-4z"/>
            <path fill="#d5d7db" d="m576 468 9 12-6-1v-2q0-3-4-5z"/>
            <path fill="#ccced2" d="m455 501 2 1-7 5 1 4-4 2v-3h-5q3-4 8-6l3-2z"/>
            <path fill="#d1d2d7" d="m664 402-9 6-3 2-2 1q1-5 5-8z"/>
            <path fill="#285b8e" d="m421 303 11 4 3 2 4 4-2-1-9-3v-2h-5z"/>
            <path fill="#d5d6da" d="m531 617 2 1 8 1q-4 4-12 4h-2l1-4h3z"/>
            <path fill="#d7d8dc" d="m492 479 1 3-5 4h-7c7-7 7-7 11-7"/>
            <path fill="#c7c8cd" d="m300 619 4 3-1 2 2 1-5-1h-3l-5-3q3-2 8-2"/>
            <path fill="#d7d9dd" d="m600 312 12 7-2 3-3-1v-2h-3v-2l-3-1z"/>
            <path fill="#cfd0d5" d="m408 545 2 1-2 1zm-12 2h8l5 2v2q-7 0-13-3z"/>
            <path fill="#d5d7db" d="m322 498 4 2v2l4 2v3l-5-3-3-1-4-4 4 1z"/>
            <path fill="#dedfe2" d="m642 415-9 7-3-1q5-7 12-6"/>
            <path fill="#d8d9dd" d="M336 611h7l7 2-3 1-4 2z"/>
            <path fill="#cfd0d5" d="M333 506c7 2 7 2 9 6l1 3-12-7z"/>
            <path fill="#dcdde1" d="m252 323 5 1-5 4-2 2-2 1-3-1 1-3 6-2z"/>
            <path fill="#d6d8db" d="M549 281c7 2 7 2 9 5l-1 4-5-4v-3l-3 1z"/>
            <path fill="#d9dade" d="m351 613 19 1v1h-3l-5 2-7-1-2-1-2-1z"/>
            <path fill="#d3d4d9" d="M239 580q5 1 5 4l-1 9-2-4-1-2z"/>
            <path fill="#c9cacf" d="m378 533 4 3 2 5q-5-2-11-6 2-2 5-2"/>
            <path fill="#cfd1d5" d="M598 416h1v5l5 2v5h-3q-3-5-3-12"/>
            <path fill="#d5d6da" d="m388 539 2 5h2v-3h2l2 6-7-2v-2l-4-1z"/>
            <path fill="#d3d4d9" d="m627 422 3 2-6 4-2 1-5 3-2-1 1-3 7-1 1-3z"/>
            <path fill="#cdcfd3" d="m198 357 1 2 2 1-9 6-1-3z"/>
            <path fill="#c9cacf" d="M582 332h6l2 4h4l1 4-13-7z"/>
            <path fill="#dedfe2" d="M519 604h6l-4 7-1-1-4-3 3-1z"/>
            <path fill="#cdced3" d="m506 469 2 1-3 5h-2l-1 2-5-1c5-6 5-6 9-7"/>
            <path fill="#dcdde0" d="M191 337v2l2 1c-5 2-5 2-9 1l-2-1q4-4 9-3"/>
            <path fill="#d7d8db" d="M530 297q4 0 7 3l-1 4-8-5z"/>
            <path fill="#d7d8dc" d="m396 232 2 1h3l1-1h6l-7 4-2 1-4 1z"/>
            <path fill="#ac9961" d="m668 591 1 2-5 5-3 2-5 2q2-5 7-8l3-2z"/>
            <path fill="#dedfe2" d="m324 472 8 4-2 3-6-2z"/>
            <path fill="#cecfd3" d="M182 375h1v2l1 2v3l3 4-3 1-3-2v-3l-2-1 2-1z"/>
            <path fill="#d9dade" d="m440 538 5 1q-4 5-10 6l-1-2h2l3-3z"/>
            <path fill="#2a5787" d="m347 395 2 1 1 7h2l1 6-2 1z"/>
            <path fill="#caccd0" d="m171 401 2 7-10-5q3-2 8-2"/>
            <path fill="#d1d2d6" d="M611 350h4l3 1 4 2-1 3q-6-1-10-6"/>
            <path fill="#d2d3d7" d="m213 320 2 1-4 5h-4l-2-1 4-3 2-1z"/>
            <path fill="#d9dade" d="m281 306 3 2-5 4-3 1-5 2v-2h2v-2l8-3z"/>
            <path fill="#e3e4e6" d="M304 291h4q0 3-4 5h-7l2-2h4z"/>
            <path fill="#c6c8cd" d="M444 246h9l1 6-10-5z"/>
            <path fill="#dfe0e3" d="M519 492v2l-8 4v-5z"/>
            <path fill="#dedfe2" d="m585 481 3 3v12c-3-5-3-5-3-8l2-3h-2z"/>
            <path fill="#d5d6da" d="m179 408 2 2 3 1v4q-5-1-9-6z"/>
            <path fill="#295686" d="M373 322h2v2h-2l-1 3-6 3-2-1q2-4 7-5z"/>
            <path fill="#cbcdd1" d="m248 298 2 1-3 4h-2v2l-4 1-1-3 4-3 2-1z"/>
            <path fill="#d2d3d8" d="m339 274-12 7 1-4h4l1-3z"/>
            <path fill="#d8d9dd" d="M369 251h5l-9 7h-2l-1-3 7-1z"/>
            <path fill="#295b8e" d="M343 382h2q3 6 2 13l-3-8-1-3z"/>
            <path fill="#29598b" d="M440 314q6 2 10 7h-5v-2l-3-1z"/>
            <path fill="#d0d1d5" d="m344 238 2 1-1 4-5 2v-2l-2-1z"/>
            <path fill="#c1c2c9" d="m277 280 2 1-11 7-2-1 5-4 3-2z"/>
            <path fill="#d3d4d8" d="m293 270 2 1-2 7-2-4-4 1z"/>
            <path fill="#d8d9dc" d="M494 271h4v3l-4-1zm-3 1 3 1-2 1v2l-4-2z"/>
            <path fill="#d0d2d6" d="m512 257 9 5h-8z"/>
            <path fill="#d7d8dc" d="m467 258 3 1 1-1q3 2 2 6l-5-2z"/>
            <path fill="#dcdde0" d="m451 219 6 3-1 3h-5z"/>
            <path fill="#bcbec4" d="M305 604c7 1 7 1 9 3l-7 2z"/>
            <path fill="#e0e1e4" d="m243 590 3 1v3l3 1-2 4c-4-6-4-6-4-9"/>
            <path fill="#c5c7cc" d="m429 517 2 1-7 6-5-2 7-3z"/>
            <path fill="#d1d2d6" d="M531 480h9l-4 2v2l-3 1z"/>
            <path fill="#c4c5cb" d="M601 344h6l4 5q-5 0-10-4z"/>
            <path fill="#c9cacf" d="m381 216-2 5-4 1-2-2z"/>
            <path fill="#e0e1e4" d="m553 448 6 3v2h-5l-2-3z"/>
            <path fill="#29517e" d="m356 422 4 4v6c-4-4-4-4-4-8z"/>
            <path fill="#cbcdd1" d="m497 276 3 1-1 3-6-2-1-2z"/>
            <path fill="#e1e2e4" d="m365 225 2 1v3l-2 1v2l-4-1z"/>
            <path fill="#c9cad0" d="M364 528h5l4 5q-5 0-9-4z"/>
            <path fill="#d2d3d8" d="m523 487 4 2-8 4v-3z"/>
            <path fill="#e1e2e5" d="m511 466 2 1-4 2v3l3 1h-7z"/>
            <path fill="#d5d6da" d="M226 441h9q-2 4-5 4z"/>
            <path fill="#dadcdf" d="m200 394 7 4-1 2-5-1v-2l-2-1z"/>
            <path fill="#d8d9dd" d="m564 290 8 4-4 2-3-1z"/>
            <path fill="#c9cad0" d="m541 304h3v4h2l-1 2-6-4z"/>
        </svg>
    );
};

export default BrandLogo;
