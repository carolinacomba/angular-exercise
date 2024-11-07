import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private http = inject(HttpClient);
  private url: string = "http://localhost:3000/products" 
  constructor() { }


  getProductos():Observable<Producto[]>{
    return this.http.get<Producto[]>(this.url);
  }
}
