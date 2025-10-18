import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialExampleModule } from './material.module';
import { HttpClientModule } from '@angular/common/http';
import { AngularEditorModule } from '@kolkov/angular-editor';
import {NgxPaginationModule} from 'ngx-pagination';
import { ArraySortPipe } from './pipes/array-sort.pipe';
import { SearchSortPipe } from './pipes/search-sort.pipe';
import { NgxSpinnerModule } from "ngx-spinner";
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {WebcamModule} from 'ngx-webcam';
import { SheduleMomentPipe } from './pipes/shedule-moment.pipe';
import { CustomTimerPipe } from './pipes/custom-timer.pipe';
import {IvyCarouselModule} from 'angular-responsive-carousel';
// Import library module
import { NgxAudioPlayerModule } from 'ngx-audio-player';
import {RouterModule} from '@angular/router';

@NgModule({
  declarations: [
    ArraySortPipe,
    SearchSortPipe,
    SheduleMomentPipe,
    CustomTimerPipe,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialExampleModule,
    HttpClientModule,
    AngularEditorModule,
    NgxPaginationModule,
    NgxSpinnerModule,
    WebcamModule,
    IvyCarouselModule,
    NgxAudioPlayerModule,
    RouterModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialExampleModule,
    HttpClientModule,
    AngularEditorModule,
    NgxPaginationModule,
    ArraySortPipe,
    SearchSortPipe,
    NgxSpinnerModule,
    WebcamModule,
    SheduleMomentPipe,
    CustomTimerPipe,
    IvyCarouselModule,
    NgxAudioPlayerModule,
  ]
})
export class SharedModule {
  static forRoot() {
    return {
      ngModule: SharedModule,
      providers: [
        MaterialExampleModule,
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} }
      ],
    };
 }
 }
