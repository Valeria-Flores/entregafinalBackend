const Ticket = require('../models/Ticket');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class TicketDAO {
  constructor() {
    this.tickets = [];
  }

  save(ticket) {
    ticket.id = uuidv4();
    this.tickets.push(ticket);
    fs.writeFileSync('tickets.json', JSON.stringify(this.tickets, null, 2));
    return ticket;
  }
}

module.exports = TicketDAO;
