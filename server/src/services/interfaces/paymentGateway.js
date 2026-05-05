export class PaymentGateway {
    async initializePayment(email, amount, metadata) {
        throw new Error("Method 'initializePayment()' must be implemented.");
    }
    async verifyPayment(reference) {
        throw new Error("Method 'verifyPayment()' must be implemented.");
    }
}