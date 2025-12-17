import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceProvidersList } from './service-providers-list';

describe('ServiceProvidersList', () => {
  let component: ServiceProvidersList;
  let fixture: ComponentFixture<ServiceProvidersList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceProvidersList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceProvidersList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
