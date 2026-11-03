import { ComponentFixture, TestBed } from '@angular/core/testing';

import { addTrip } from './add-trip';

describe('AddTrip', () => {
  let component: addTrip;
  let fixture: ComponentFixture<addTrip>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [addTrip]
    })
    .compileComponents();

    fixture = TestBed.createComponent(addTrip);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
