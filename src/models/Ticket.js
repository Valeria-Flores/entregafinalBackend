class Ticket {
    constructor(code, purchase_datetime, amount, purchaser) {
      this.code = code; // Autogenerado y único
      this.purchase_datetime = new Date(); // Fecha y hora exactas
      this.amount = amount; // Total de la compra
      this.purchaser = purchaser; // Correo del usuario
    }
  }
  
  module.exports = Ticket;
  