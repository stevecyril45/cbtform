import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ParticipantsService, ParticipantRecord } from '../shared/services/participants/participants.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  participantForm: FormGroup;
  isSubmitting = false;
  isSubmittedSuccessfully = false;
  selectedSolutions: string[] = [];
  
  industries = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
    'Retail', 'Construction', 'Hospitality', 'Transportation', 'Other'
  ];
  
  solutions = [
    { value: 'emotionalIntelligence', label: 'Emotional Intelligence Training' },
    { value: 'customerExperience', label: 'Customer Experience Transformation' },
    { value: 'leadershipDevelopment', label: 'Leadership Development Programs' },
    { value: 'teamworkTraining', label: 'Teamwork & Collaboration Training' },
    { value: 'corporateCulture', label: 'Corporate Culture Reboot' },
    { value: 'softSkills', label: 'Soft Skills & People Skills Development' },
    { value: 'coachingFrameworks', label: 'Coaching & Mentoring Frameworks' },
    { value: 'employeeEngagement', label: 'Employee Engagement Strategy' },
    { value: 'hrAdvisory', label: 'HR Advisory Solutions' },
    { value: 'others', label: 'Others (please specify)' }
  ];

  constructor(
    private fb: FormBuilder,
    private participantService: ParticipantsService
  ) {
    this.participantForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.initForm();
    this.setupConditionalValidators();
    
    // Check if already submitted
    const hasSubmitted = localStorage.getItem('formSubmitted');
    if (hasSubmitted === 'true') {
      this.isSubmittedSuccessfully = true;
    }
  }

  private initForm(): void {
    this.participantForm = this.fb.group({
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(30),
        Validators.pattern('^[a-zA-Z\\s]*$')
      ]],
      middleName: [''],
      surname: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(30)
      ]],
      certificateName: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(100)
      ]],
      isEmployed: ['', Validators.required],
      jobTitle: [''],
      organization: [''],
      industry: [''],
      careerStatus: ['', Validators.maxLength(500)],
      industryInterest: [''],
      takeaways: ['', [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(1000)
      ]],
      applicationPlan: ['', [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(1000)
      ]],
      behavioralChanges: ['', [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(1000)
      ]],
      wouldRecommend: ['', Validators.required],
      solutions: [''],
      serviceNeedReason: ['', [
        Validators.maxLength(500)
      ]],
      connectWithOrg: [''],
      contactName: [''],
      contactTitle: [''],
      contactPhone: [''],
      contactEmail: ['', Validators.email],
      contactDepartment: [''],
      additionalComments: ['', [
        Validators.maxLength(500)
      ]]
    });
  }

  private setupConditionalValidators(): void {
    this.participantForm.get('isEmployed')?.valueChanges.subscribe(value => {
      if (value === 'Yes') {
        this.participantForm.get('jobTitle')?.setValidators([Validators.required]);
        this.participantForm.get('organization')?.setValidators([Validators.required]);
        this.participantForm.get('industry')?.setValidators([Validators.required]);
        this.participantForm.get('careerStatus')?.clearValidators();
        this.participantForm.get('industryInterest')?.clearValidators();
      } else if (value === 'No') {
        this.participantForm.get('careerStatus')?.setValidators([Validators.required]);
        this.participantForm.get('industryInterest')?.setValidators([Validators.required]);
        this.participantForm.get('jobTitle')?.clearValidators();
        this.participantForm.get('organization')?.clearValidators();
        this.participantForm.get('industry')?.clearValidators();
      }
      
      this.updateConditionalControls();
    });
    
    this.participantForm.get('connectWithOrg')?.valueChanges.subscribe(value => {
      if (value === 'Yes') {
        this.participantForm.get('contactName')?.setValidators([Validators.required]);
        this.participantForm.get('contactEmail')?.setValidators([Validators.required, Validators.email]);
      } else {
        this.participantForm.get('contactName')?.clearValidators();
        this.participantForm.get('contactEmail')?.clearValidators();
      }
      this.updateContactControls();
    });
  }

  private updateConditionalControls(): void {
    ['jobTitle', 'organization', 'industry', 'careerStatus', 'industryInterest'].forEach(controlName => {
      this.participantForm.get(controlName)?.updateValueAndValidity();
    });
  }

  private updateContactControls(): void {
    ['contactName', 'contactEmail'].forEach(controlName => {
      this.participantForm.get(controlName)?.updateValueAndValidity();
    });
  }

  onSolutionSelect(event: any, solutionValue: string): void {
    if (event.target.checked) {
      if (!this.selectedSolutions.includes(solutionValue)) {
        this.selectedSolutions.push(solutionValue);
      }
    } else {
      this.selectedSolutions = this.selectedSolutions.filter(s => s !== solutionValue);
    }
    this.participantForm.get('solutions')?.setValue(this.selectedSolutions.join(','));
  }

  submitParticipantInfo(): void {
    if (this.participantForm.invalid) {
      this.markAllFieldsAsTouched();
      
      // Check solutions selection
      if (this.participantForm.get('wouldRecommend')?.value === 'Yes' && this.selectedSolutions.length === 0) {
        alert('Please select at least one solution/service your organization needs.');
        return;
      }
      
      this.showValidationErrors();
      return;
    }
    
    if (this.isSubmitting) {
      return;
    }
    
    this.isSubmitting = true;
    
    const formData = this.participantForm.value;
    
    // Create participant record
    const participantRecord: ParticipantRecord = {
      firstName: formData.firstName.trim(),
      middleName: formData.middleName?.trim() || '',
      surname: formData.surname.trim(),
      certificateName: formData.certificateName.trim(),
      email: formData.email.trim().toLowerCase(),
      isEmployed: formData.isEmployed,
      jobTitle: formData.jobTitle?.trim() || '',
      organization: formData.organization?.trim() || '',
      industry: formData.industry || '',
      careerStatus: formData.careerStatus?.trim() || '',
      industryInterest: formData.industryInterest || '',
      takeaways: formData.takeaways.trim(),
      applicationPlan: formData.applicationPlan.trim(),
      behavioralChanges: formData.behavioralChanges.trim(),
      wouldRecommend: formData.wouldRecommend,
      solutions: this.selectedSolutions,
      serviceNeedReason: formData.serviceNeedReason?.trim() || '',
      connectWithOrg: formData.connectWithOrg || '',
      contactName: formData.contactName?.trim() || '',
      contactTitle: formData.contactTitle?.trim() || '',
      contactPhone: formData.contactPhone?.trim() || '',
      contactEmail: formData.contactEmail?.trim() || '',
      contactDepartment: formData.contactDepartment?.trim() || '',
      additionalComments: formData.additionalComments?.trim() || '',
      date: new Date().toISOString()
    };
    
    console.log('Submitting to Firebase:', participantRecord);
    
    // Save to Firebase
    this.participantService.saveParticipant(participantRecord).subscribe({
      next: (response) => {
        console.log('Firebase response:', response);
        
        let firebaseId: string;
        
        if (response && response.name) {
          firebaseId = response.name;
        } else if (response && typeof response === 'string') {
          firebaseId = response;
        } else {
          firebaseId = 'local_' + Date.now();
        }
        
        // Save to localStorage
        localStorage.setItem('participantInfo', JSON.stringify(participantRecord));
        localStorage.setItem('firebaseId', firebaseId);
        localStorage.setItem('formSubmitted', 'true');
        
        this.isSubmitting = false;
        this.isSubmittedSuccessfully = true;
        
        console.log('Success! Firebase ID:', firebaseId);
        alert('Thank you! Your information has been submitted successfully. Click "Start Exam" to begin.');
      },
      error: (error) => {
        console.error('Firebase error details:', error);
        this.isSubmitting = false;
        
        // Show detailed error
        let errorMessage = 'Failed to save to Firebase. ';
        
        if (error.status === 401) {
          errorMessage += 'Authentication error. Check Firebase rules.';
        } else if (error.status === 403) {
          errorMessage += 'Permission denied. Check write permissions.';
        } else if (error.status === 0) {
          errorMessage += 'Network error. Check your internet connection.';
        } else {
          errorMessage += `Error: ${error.status} - ${error.statusText}`;
        }
        
        alert(errorMessage);
        
        // Fallback to localStorage
        const localId = 'local_' + Date.now();
        localStorage.setItem('participantInfo', JSON.stringify(participantRecord));
        localStorage.setItem('firebaseId', localId);
        localStorage.setItem('formSubmitted', 'true');
        
        this.isSubmittedSuccessfully = true;
        
      }
    });
  }

  // Go back to edit form
  editForm(): void {
    this.isSubmittedSuccessfully = false;
  }

  // Clear all data and start fresh
  startFresh(): void {
    if (confirm('Are you sure you want to start fresh? All your previous data will be cleared.')) {
      localStorage.removeItem('participantInfo');
      localStorage.removeItem('firebaseId');
      localStorage.removeItem('formSubmitted');
      
      this.participantForm.reset();
      this.selectedSolutions = [];
      this.isSubmittedSuccessfully = false;
      
      Object.keys(this.participantForm.controls).forEach(key => {
        const control = this.participantForm.get(key);
        control?.markAsUntouched();
        control?.markAsPristine();
      });
    }
  }

  startExam(): void {
    window.open('https://cbt.celcium360solutions.com/cbt', '_blank', 'noopener,noreferrer');
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.participantForm.controls).forEach(key => {
      const control = this.participantForm.get(key);
      control?.markAsTouched();
    });
  }

  private showValidationErrors(): void {
    const errors: string[] = [];
    
    if (this.participantForm.get('firstName')?.invalid) errors.push('First Name is required');
    if (this.participantForm.get('surname')?.invalid) errors.push('Surname is required');
    if (this.participantForm.get('certificateName')?.invalid) errors.push('Certificate Name is required');
    if (this.participantForm.get('email')?.invalid) errors.push('Valid Email Address is required');
    if (this.participantForm.get('isEmployed')?.invalid) errors.push('Please select employment status');
    if (this.participantForm.get('takeaways')?.invalid) errors.push('Masterclass takeaways are required');
    if (this.participantForm.get('applicationPlan')?.invalid) errors.push('Application plan is required');
    if (this.participantForm.get('behavioralChanges')?.invalid) errors.push('Behavioral changes are required');
    if (this.participantForm.get('wouldRecommend')?.invalid) errors.push('Please indicate if you would recommend us');
    
    if (this.participantForm.get('isEmployed')?.value === 'Yes') {
      if (this.participantForm.get('jobTitle')?.invalid) errors.push('Job Title is required');
      if (this.participantForm.get('organization')?.invalid) errors.push('Organization Name is required');
      if (this.participantForm.get('industry')?.invalid) errors.push('Industry is required');
    }
    
    if (this.participantForm.get('isEmployed')?.value === 'No') {
      if (this.participantForm.get('careerStatus')?.invalid) errors.push('Career status is required');
      if (this.participantForm.get('industryInterest')?.invalid) errors.push('Industry interest is required');
    }
    
    if (this.participantForm.get('connectWithOrg')?.value === 'Yes') {
      if (this.participantForm.get('contactName')?.invalid) errors.push('Contact Name is required');
      if (this.participantForm.get('contactEmail')?.invalid) errors.push('Valid Contact Email is required');
    }
    
    if (this.participantForm.get('wouldRecommend')?.value === 'Yes' && this.selectedSolutions.length === 0) {
      errors.push('Please select at least one solution/service');
    }
    
    if (errors.length > 0) {
      alert('Please fix the following errors:\n\n• ' + errors.join('\n• '));
    }
  }
}