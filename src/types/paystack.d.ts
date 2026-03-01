// Type declarations for @paystack/inline-js
declare module "@paystack/inline-js" {
    interface PaystackOptions {
        key?: string;
        email?: string;
        amount?: number;
        ref?: string;
        onSuccess?: (transaction: { reference: string }) => void;
        onCancel?: () => void;
    }

    interface ResumeOptions {
        onSuccess?: (transaction: { reference: string }) => void;
        onCancel?: () => void;
    }

    class PaystackPop {
        resumeTransaction(reference: string, options: ResumeOptions): void;
        newTransaction(options: PaystackOptions): void;
    }

    export default PaystackPop;
}
