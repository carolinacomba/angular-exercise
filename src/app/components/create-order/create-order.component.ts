import { Component, inject } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  FormArray,
  ReactiveFormsModule,
  ValidationErrors,
  AsyncValidator,
  AsyncValidatorFn,
  AbstractControl,
} from '@angular/forms';
import { Producto } from '../../models/producto';
import { OrdersService } from '../../services/orders.service';
import { ProductsService } from '../../services/products.service';
import { CommonModule } from '@angular/common';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { Orden } from '../../models/orden';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-order.component.html',
  styleUrl: './create-order.component.css',
})
export class CreateOrderComponent {
  productos: Producto[] = [];
  private readonly orderService = inject(OrdersService);
  private readonly productsService = inject(ProductsService);
  router: Router = inject(Router);

  ngOnInit(): void {
    this.loadProducts();
    this.calculateTotal();
  }

  loadProducts() {
    this.productsService.getProductos().subscribe({
      next: (data) => {
        this.productos = data;
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  orderForm: FormGroup = new FormGroup({
    customerName: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
    ]),
    email: new FormControl(
      '',
      [Validators.required, Validators.email],
      [this.emailOrderLimitValidator()]
    ),
    products: new FormArray(
      [],
      [Validators.required, this.uniqueProductValidator]
    ),
  });

  get productsFormArray() {
    return this.orderForm.get('products') as FormArray;
  }

  addProduct() {
    const productForm: FormGroup = new FormGroup({
      productId: new FormControl(''),
      price: new FormControl(0),
      quantity: new FormControl(0),
      stock: new FormControl(0),
    });

    productForm.get('productId')?.valueChanges.subscribe((id) => {
      const product = this.productos.find((p) => p.id == id);
      if (product) {
        productForm.patchValue({
          price: product.price,
          stock: product.stock,
        });

        const quantityControl = productForm.get('quantity');
        quantityControl?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(product.stock),
        ]);
      }
      this.calculateTotal();
    });

    productForm.get('quantity')?.valueChanges.subscribe(() => {
      this.calculateTotal();
    });
    this.productsFormArray.push(productForm);
  }

  removeProduct(index: number) {
    this.productsFormArray.removeAt(index);
    this.calculateTotal();
  }

  uniqueProductValidator(productsArray: FormArray): ValidationErrors | null {
    const selectedProductIds = productsArray.controls.map(
      (control) => control.get('productId')?.value as Number
    );
    const hasDuplicates = selectedProductIds.some(
      (id, index) => selectedProductIds.indexOf(id) !== index
    );
    return hasDuplicates ? { duplicatedProduct: true } : null;
  }

  emailOrderLimitValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value) {
        return of(null);
      }

      return this.orderService.getOrderByEmail(control.value).pipe(
        tap((orders) => console.log(orders)),
        map((orders) => {
          const now = new Date();
          const recentOrders = orders.filter((order) => {
            const orderDate = order.timestamp
              ? new Date(order.timestamp)
              : new Date();
            const diffInMilliseconds = now.getTime() - orderDate.getTime();
            const diffInDays = diffInMilliseconds / (1000 * 60 * 60);
            return diffInDays <= 24;
          });

          if (recentOrders.length >= 3) {
            return { emailOrderLimit: true };
          }
          return null;
        }),
        catchError(() => of(null))
      );
    };
  }

  hasDiscount: boolean = false;
  total: number = 0;
  calculateTotal(): void {
    let subtotal = 0;

    this.productsFormArray.controls.forEach((control) => {
      const quantity = control.get('quantity')?.value || 0;
      const price = control.get('price')?.value || 0;
      if (quantity && price) {
        subtotal += quantity * price;
      }
    });

    this.hasDiscount = subtotal > 1000;

    this.total = this.hasDiscount ? subtotal * 0.9 : subtotal;
  }

  private generateOrderCode(name: string, email: string): string {
    const now = new Date().toJSON;
    const firstLetter = name.charAt(0).toUpperCase();
    const emailSuffix = email.slice(-4);

    return `${firstLetter}${emailSuffix}${now}`;
  }

  onSubmit(): void {
    if (this.orderForm.valid) {
      const formValue = this.orderForm.value;

      const order: Orden = {
        customerName: formValue.customerName,
        email: formValue.email,
        products: formValue.products,
        total: this.total,
        orderCode: this.generateOrderCode(
          formValue.customerName,
          formValue.email
        ),
        timestamp: new Date().toJSON(),
      };

      this.orderService.createOrder(order).subscribe({
        next: (data) => {
          this.router.navigate(['/orders']);
        },
        error: () => {
          alert("Error al crear el pedido");
        },
      })
    } else this.orderForm.markAllAsTouched();
  }
}
