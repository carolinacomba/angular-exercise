import { Component, inject, OnInit } from '@angular/core';
import { Orden } from '../../models/orden';
import { OrdersService } from '../../services/orders.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-list-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './list-orders.component.html',
  styleUrl: './list-orders.component.css'
})
export class ListOrdersComponent implements OnInit{
  filtro = new FormControl('');
  orders: Orden[] = [];
  filteredOrders: Orden[] = [];
  private orderService = inject(OrdersService);

  ngOnInit(): void {
    // Obtener pedidos y suscribirse a los cambios en el filtro
    this.getOrders();
    
    this.filtro.valueChanges.subscribe(data => {
      if (data === null || data === '') {
        return this.getOrders(); // Volver a cargar todos los pedidos si el filtro está vacío
      }
      this.filteredOrders = this.orders.filter(order =>
        order.customerName.toUpperCase().includes(data.toUpperCase()) ||
        order.email.toUpperCase().includes(data.toUpperCase())
      );
    });
  }

  // Obtener todos los pedidos del servicio y actualizar la lista
  getOrders() {
    this.orderService.getOrders().subscribe({
      next: (data: Orden[]) => {
        this.orders = data;
        this.filteredOrders = data; // Inicializar la lista filtrada con todos los pedidos
      },
      error: (err) => console.error(err),
      complete: () => console.log("complete")
    });
  }
}
