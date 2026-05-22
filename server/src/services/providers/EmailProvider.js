export default class EmailProvider {
  /**
   * @param {Object} options
   * @param {string} options.to
   * @param {string} options.subject
   * @param {string} options.html
   * @param {string} [options.recipientName]
   * @returns {Promise<any>}
   */
  async sendEmail(options) {
    throw new Error('Method not implemented.');
  }
}
