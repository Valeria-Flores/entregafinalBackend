const TicketDAO = require('../daos/TicketDAO');

class TicketRepository {
  constructor() {
    this.ticketDAO = new TicketDAO();
  }

  createTicket(data) {
    const ticket = new Ticket(data.code, data.purchase_datetime, data.amount, data.purchaser);
    return this.ticketDAO.save(ticket);
  }
}

module.exports = TicketRepository;
