import {TestBed, ComponentFixture} from '@angular/core/testing';
import {Component, DebugElement, Type} from '@angular/core';
import {By} from '@angular/platform-browser';
import {dispatchFakeEvent} from '../../cdk/testing/private';
import {MatProgressBarModule} from './index';
import {MatProgressBar} from './progress-bar';


describe('MDC-based MatProgressBar', () => {
  function createComponent<T>(componentType: Type<T>,
                              imports?: Type<{}>[]): ComponentFixture<T> {
    TestBed.configureTestingModule({
      imports: imports || [MatProgressBarModule],
      declarations: [componentType]
    }).compileComponents();

    return TestBed.createComponent<T>(componentType);
  }

  // All children need to be hidden for screen readers in order to support ChromeVox.
  // More context in the issue: https://github.com/angular/components/issues/22165.
  it('should have elements wrapped in aria-hidden div', () => {
    const fixture = createComponent(BasicProgressBar);
    const host = fixture.nativeElement as Element;
    const element = host.children[0];
    const children = element.children;
    expect(children.length).toBe(3);

    const ariaHidden = Array.from(children).map(child => child.getAttribute('aria-hidden'));
    expect(ariaHidden).toEqual(['true', 'true', 'true']);
  });

  describe('with animation', () => {
    describe('basic progress-bar', () => {
      it('should apply a mode of "determinate" if no mode is provided.', () => {
        const fixture = createComponent(BasicProgressBar);
        fixture.detectChanges();
        const progressElement = fixture.debugElement.query(By.css('mat-progress-bar'))!;
        expect(progressElement.componentInstance.mode).toBe('determinate');
      });

      it('should define default values for value and bufferValue attributes', () => {
        const fixture = createComponent(BasicProgressBar);
        fixture.detectChanges();
        const progressElement = fixture.debugElement.query(By.css('mat-progress-bar'))!;
        expect(progressElement.componentInstance.value).toBe(0);
        expect(progressElement.componentInstance.bufferValue).toBe(0);
      });

      it('should clamp value and bufferValue between 0 and 100', () => {
        const fixture = createComponent(BasicProgressBar);
        fixture.detectChanges();

        const progressElement = fixture.debugElement.query(By.css('mat-progress-bar'))!;
        const progressComponent = progressElement.componentInstance;

        progressComponent.value = 50;
        expect(progressComponent.value).toBe(50);

        progressComponent.value = 999;
        expect(progressComponent.value).toBe(100);

        progressComponent.value = -10;
        expect(progressComponent.value).toBe(0);

        progressComponent.bufferValue = -29;
        expect(progressComponent.bufferValue).toBe(0);

        progressComponent.bufferValue = 9;
        expect(progressComponent.bufferValue).toBe(9);

        progressComponent.bufferValue = 1320;
        expect(progressComponent.bufferValue).toBe(100);
      });

      it('should set the proper transform based on the current value', () => {
        const fixture = createComponent(BasicProgressBar);
        fixture.detectChanges();

        const progressElement = fixture.debugElement.query(By.css('mat-progress-bar'))!;
        const progressComponent = progressElement.componentInstance;
        const primaryStyles =
            progressElement.nativeElement.querySelector('.mdc-linear-progress__primary-bar').style;
        const bufferStyles =
          progressElement.nativeElement.querySelector('.mdc-linear-progress__buffer-bar').style;

        // Parse out and round the value since different
        // browsers return the value with a different precision.
        const getBufferValue = () => Math.floor(parseInt(bufferStyles.flexBasis));

        expect(primaryStyles.transform).toBe('scaleX(0)');
        expect(getBufferValue()).toBe(100);

        progressComponent.value = 40;
        expect(primaryStyles.transform).toBe('scaleX(0.4)');
        expect(getBufferValue()).toBe(100);

        progressComponent.value = 35;
        progressComponent.bufferValue = 55;
        expect(primaryStyles.transform).toBe('scaleX(0.35)');
        expect(getBufferValue()).toBe(100);

        progressComponent.mode = 'buffer';
        expect(primaryStyles.transform).toBe('scaleX(0.35)');
        expect(getBufferValue()).toEqual(55);

        progressComponent.value = 60;
        progressComponent.bufferValue = 60;
        expect(primaryStyles.transform).toBe('scaleX(0.6)');
        expect(getBufferValue()).toEqual(60);
      });

      it('should remove the `aria-valuenow` attribute in indeterminate mode', () => {
        const fixture = createComponent(BasicProgressBar);
        fixture.detectChanges();

        const progressElement = fixture.debugElement.query(By.css('mat-progress-bar'))!;
        const progressComponent = progressElement.componentInstance;

        progressComponent.mode = 'determinate';
        progressComponent.value = 50;
        fixture.detectChanges();

        expect(progressElement.nativeElement.getAttribute('aria-valuenow'))
          .withContext('Expected aria-valuenow to be set in determinate mode.').toBe('50');

        progressComponent.mode = 'indeterminate';
        fixture.detectChanges();

        expect(progressElement.nativeElement.hasAttribute('aria-valuenow'))
          .withContext('Expect aria-valuenow to be cleared in indeterminate mode.').toBe(false);
      });

      it('should remove the `aria-valuenow` attribute in query mode', () => {
        const fixture = createComponent(BasicProgressBar);
        fixture.detectChanges();

        const progressElement = fixture.debugElement.query(By.css('mat-progress-bar'))!;
        const progressComponent = progressElement.componentInstance;

        progressComponent.mode = 'determinate';
        progressComponent.value = 50;
        fixture.detectChanges();

        expect(progressElement.nativeElement.getAttribute('aria-valuenow'))
          .withContext('Expected aria-valuenow to be set in determinate mode.').toBe('50');

        progressComponent.mode = 'query';
        fixture.detectChanges();

        expect(progressElement.nativeElement.hasAttribute('aria-valuenow'))
          .withContext('Expect aria-valuenow to be cleared in query mode.').toBe(false);
      });

    });

    describe('animation trigger on determinate setting', () => {
      let fixture: ComponentFixture<BasicProgressBar>;
      let progressComponent: MatProgressBar;
      let primaryValueBar: DebugElement;

      beforeEach(() => {
        fixture = createComponent(BasicProgressBar);

        const progressElement = fixture.debugElement.query(By.css('mat-progress-bar'))!;
        progressComponent = progressElement.componentInstance;
        primaryValueBar = progressElement.query(By.css('.mdc-linear-progress__primary-bar'))!;
      });

      it('should trigger output event on primary value bar animation end', () => {
        fixture.detectChanges();
        spyOn(progressComponent.animationEnd, 'next');

        progressComponent.value = 40;
        expect(progressComponent.animationEnd.next).not.toHaveBeenCalled();

        // On animation end, output should be emitted.
        dispatchFakeEvent(primaryValueBar.nativeElement, 'transitionend');
        expect(progressComponent.animationEnd.next).toHaveBeenCalledWith({ value: 40 });
      });
    });

    describe('animation trigger on buffer setting', () => {
      let fixture: ComponentFixture<BufferProgressBar>;
      let progressComponent: MatProgressBar;
      let primaryValueBar: DebugElement;

      beforeEach(() => {
        fixture = createComponent(BufferProgressBar);

        const progressElement = fixture.debugElement.query(By.css('mat-progress-bar'))!;
        progressComponent = progressElement.componentInstance;
        primaryValueBar = progressElement.query(By.css('.mdc-linear-progress__primary-bar'))!;
      });

      it('should bind on transitionend eventListener on primaryBarValue', () => {
        spyOn(primaryValueBar.nativeElement, 'addEventListener');
        fixture.detectChanges();

        expect(primaryValueBar.nativeElement.addEventListener).toHaveBeenCalled();
        expect(primaryValueBar.nativeElement.addEventListener
               .calls.mostRecent().args[0]).toBe('transitionend');
      });

      it('should trigger output event on primary value bar animation end', () => {
        fixture.detectChanges();
        spyOn(progressComponent.animationEnd, 'next');

        progressComponent.value = 40;
        expect(progressComponent.animationEnd.next).not.toHaveBeenCalled();

        // On animation end, output should be emitted.
        dispatchFakeEvent(primaryValueBar.nativeElement, 'transitionend');
        expect(progressComponent.animationEnd.next).toHaveBeenCalledWith({ value: 40 });
      });

      it('should trigger output event with value not bufferValue', () => {
        fixture.detectChanges();
        spyOn(progressComponent.animationEnd, 'next');

        progressComponent.value = 40;
        progressComponent.bufferValue = 70;
        expect(progressComponent.animationEnd.next).not.toHaveBeenCalled();

        // On animation end, output should be emitted.
        dispatchFakeEvent(primaryValueBar.nativeElement, 'transitionend');
        expect(progressComponent.animationEnd.next).toHaveBeenCalledWith({ value: 40 });
      });
    });
  });

});

@Component({template: '<mat-progress-bar></mat-progress-bar>'})
class BasicProgressBar {}

@Component({template: '<mat-progress-bar mode="buffer"></mat-progress-bar>'})
class BufferProgressBar { }
