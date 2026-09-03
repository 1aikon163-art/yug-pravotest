/**
 * ЮГ-ПРАВО LegalTech — Assignment & PEP Generator
 * Генерация официального Заявления-поручения о безвозмездном досудебном содействии
 * со штампом простой электронной подписи (ПЭП) по 63-ФЗ и печатью АНО «ЦПЗ ЮГ-ПРАВО»
 */

window.AssignmentGenerator = {
  /**
   * Сформировать и открыть печатную форму / PDF Заявления-поручения с ПЭП
   * @param {Object} data Реквизиты дела и заявителя
   */
  generateAssignmentPdf: function(data) {
    if (!data) data = {};

    const caseId = data.caseId || 'ЮП-26/ОБЩ-' + String(Date.now()).slice(-4);
    const applicantName = data.name || 'Гражданин РФ';
    const phone = data.phone || '';
    const email = data.email || '';
    const accountNumber = data.accountNumber || data.account_number || '';
    const direction = data.direction || 'Защита прав потребителей и споры в сфере ЖКХ';
    const sum = data.sum || '';
    const company = data.company || '';
    const comment = data.message || data.comment || '';
    const law = data.law || '';

    const query = new URLSearchParams();
    query.set('caseId', caseId);
    if (applicantName) query.set('name', applicantName);
    if (phone) query.set('phone', phone);
    if (email) query.set('email', email);
    if (accountNumber) query.set('account', accountNumber);
    if (direction) query.set('direction', direction);
    if (sum) query.set('sum', sum);
    if (company) query.set('company', company);
    if (law) query.set('law', law);
    if (comment) query.set('comment', comment);

    try {
      localStorage.setItem('yugpravo_assignment_data', JSON.stringify({
        caseId: caseId,
        name: applicantName,
        phone: phone,
        email: email,
        account: accountNumber,
        direction: direction,
        sum: sum,
        company: company,
        law: law,
        comment: comment
      }));
      if (applicantName || phone) {
        localStorage.setItem('yugpravo_client_profile', JSON.stringify({ name: applicantName, phone: phone, email: email, account: accountNumber }));
      }
    } catch (_) {}

    const viewerUrl = 'assignment-viewer.html?' + query.toString();

    const win = window.open(viewerUrl, '_blank');
    if (!win) {
      window.location.href = viewerUrl;
    }
  }
};
