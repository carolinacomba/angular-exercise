import { CreateOrderComponent } from './components/create-order/create-order.component';
import { Routes } from '@angular/router';
import { ListOrdersComponent } from './components/list-orders/list-orders.component';

export const routes: Routes = [
    {path: "create-order", component:CreateOrderComponent},
    {path: "orders", component:ListOrdersComponent},
    {path: "", redirectTo:"/create-order", pathMatch:"full"},
    {path: "**", redirectTo:"/create-order", pathMatch:"full"}
];
