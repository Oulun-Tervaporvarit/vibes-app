import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceProvider } from './service-provider';

describe('ServiceProvider', () => {
  let component: ServiceProvider;
  let fixture: ComponentFixture<ServiceProvider>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceProvider]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceProvider);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
