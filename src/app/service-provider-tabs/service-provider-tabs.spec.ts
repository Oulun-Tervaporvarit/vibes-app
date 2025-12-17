import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceProviderTabs } from './service-provider-tabs';

describe('ServiceProviderTabs', () => {
  let component: ServiceProviderTabs;
  let fixture: ComponentFixture<ServiceProviderTabs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceProviderTabs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiceProviderTabs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
