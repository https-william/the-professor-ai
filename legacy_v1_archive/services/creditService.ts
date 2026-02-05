
import { AppMode, QuizConfig } from "../types";

export const COSTS = {
    CHAT_MESSAGE: 1,
    FLASHCARD_DECK: 5,
    EXAM_GENERATION: 10,
    PROFESSOR_LECTURE: 15,
    DUEL_HOST: 25,
    ORACLE_MULTIPLIER: 2
};

export const getModeCost = (mode: AppMode, config?: QuizConfig): number => {
    let baseCost = 0;

    switch (mode) {
        case 'EXAM':
            baseCost = COSTS.EXAM_GENERATION;
            break;
        case 'PROFESSOR':
            baseCost = COSTS.PROFESSOR_LECTURE;
            break;
        case 'FLASHCARDS':
            baseCost = COSTS.FLASHCARD_DECK;
            break;
        case 'DUEL':
            baseCost = COSTS.DUEL_HOST;
            break;
        case 'CHAT':
            baseCost = COSTS.CHAT_MESSAGE;
            break;
        default:
            baseCost = 0;
    }

    // Apply Oracle Multiplier
    if (config?.useOracle) {
        baseCost *= COSTS.ORACLE_MULTIPLIER;
    }

    return baseCost;
};

export const formatCurrency = (amount: number) => {
    return `${amount} NT`;
};
