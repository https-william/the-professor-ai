---
title: "Matrices — It's Just Organized Numbers (With Superpowers)"
meta_description: "matrices operations and determinants explained simply for Nigerian students. Covers Mathematics concepts for WAEC, JAMB. Active recall questions included."
subject: "Mathematics"
keywords:
  - "matrix multiplication"
  - "inverse matrix"
  - "simultaneous equations"
  - "matrices operations and determinants"
slug: "matrices-operations-and-determinants"
difficulty: "intermediate"
exam_relevance:
  - "WAEC"
  - "JAMB"
generated_at: "2026-05-23T16:40:14.658Z"
---

# Matrices — It's Just Organized Numbers (With Superpowers)

## The 60-Second Breakdown

A matrix is a rectangular arrangement of numbers in rows and columns. A 2×2 matrix has 2 rows and 2 columns. Matrices aren't just organized numbers — they're incredibly powerful tools for solving systems of equations, transformations in geometry, and a ton of applications in computer science and engineering.

Matrix addition and subtraction: just add or subtract corresponding elements. Both matrices must be the same size. Matrix multiplication: this is where it gets interesting. To multiply two matrices, the number of columns in the first must equal the number of rows in the second. For a 2×2 case: if A = [[a,b],[c,d]] and B = [[e,f],[g,h]], then AB = [[ae+bg, af+bh],[ce+dg, cf+dh]]. Each element is the dot product of a row from A and a column from B. Note: AB ≠ BA in general (matrix multiplication is NOT commutative). The determinant of a 2×2 matrix [[a,b],[c,d]] is ad - bc. If the determinant is 0, the matrix has no inverse (it's singular). If it's non-zero, the inverse exists: A⁻¹ = (1/det) × [[d,-b],[-c,a]]. Swap the main diagonal, negate the off-diagonal, divide by the determinant. The inverse is crucial for solving simultaneous equations in matrix form: if AX = B, then X = A⁻¹B.

## Why This Shows Up on Your Exam

WAEC and JAMB test 2×2 matrices heavily. Common questions: "Find the determinant of the matrix [[3,2],[5,4]]" (Answer: 3×4 - 2×5 = 12 - 10 = 2). "Find the inverse of [[4,3],[2,1]]" (determinant = 4-6 = -2, inverse = (-1/2)[[1,-3],[-2,4]]). JAMB loves: "If A = [[1,2],[3,4]] and B = [[5,6],[7,8]], find AB." WAEC often asks you to use matrices to solve simultaneous equations: express 2x + 3y = 7 and x + 2y = 4 as AX = B, find A⁻¹, then compute X = A⁻¹B. NECO tests when a matrix is singular (determinant = 0) and what that means for the system of equations (no unique solution). Know 2×2 operations cold — addition, subtraction, multiplication, determinant, inverse, and application to simultaneous equations.

## The Common Trap

The biggest mistake in matrix multiplication: students add elements instead of using dot products. In the product AB, each element is a SUM OF PRODUCTS — you multiply corresponding elements of a row from A and a column from B, then add them up. It's not element-by-element multiplication. Another trap: assuming AB = BA. Matrix multiplication is generally NOT commutative. AB and BA can be completely different matrices (or one might not even exist if dimensions don't match). When finding the inverse, students often forget to swap the main diagonal elements or to change the signs of the off-diagonal elements. The formula: swap a and d, negate b and c, divide everything by the determinant. And if the determinant is zero, STOP — there is no inverse. Students sometimes try to divide by zero here, which is a mathematical crime.

## Test Yourself

Don't just read — test yourself. Cover the sections above and try to answer these from memory:

1. Given A = [[2,3],[1,4]] and B = [[1,0],[2,5]], calculate (i) AB and (ii) BA. Is AB = BA?

2. Find the inverse of the matrix [[3,5],[2,4]]. Verify your answer by showing that AA⁻¹ = I (the identity matrix).

3. Use matrix methods to solve the simultaneous equations: 3x + 2y = 12 and 5x + 3y = 19.

## Go Deeper

Upload your Mathematics notes to The Professor and we'll turn them into a full exam simulation — with oral questions, marking, and feedback. Free. Takes 30 seconds.

[Try it now →](https://theprofessor.app)

<!-- JSON-LD Structured Data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "EducationalOccupationalCredential",
  "name": "Matrices — It's Just Organized Numbers (With Superpowers)",
  "description": "matrices operations and determinants explained simply for Nigerian students. Covers Mathematics concepts for WAEC, JAMB. Active recall questions included.",
  "educationalLevel": "intermediate",
  "about": {
    "@type": "Thing",
    "name": "matrices operations and determinants"
  },
  "provider": {
    "@type": "Organization",
    "name": "The Professor AI",
    "url": "https://theprofessor.app"
  },
  "inLanguage": "en",
  "isPartOf": {
    "@type": "Course",
    "name": "Mathematics Study Guide",
    "provider": {
      "@type": "Organization",
      "name": "The Professor AI"
    }
  }
}
</script>
