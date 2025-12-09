import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
export interface RecordBase {
  id?: string;
  date?: string;
  // Add common fields across all forms here
}

export interface ParticipantRecord {
  id?: string;
  date?: string;
  firstName: string;
  middleName?: string;
  surname: string;
  certificateName: string;
  email: string;
  isEmployed: string;
  jobTitle?: string;
  organization?: string;
  industry?: string;
  careerStatus?: string;
  industryInterest?: string;
  takeaways: string;
  applicationPlan: string;
  behavioralChanges: string;
  wouldRecommend: string;
  solutions: string[];
  serviceNeedReason?: string;
  connectWithOrg?: string;
  contactName?: string;
  contactTitle?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactDepartment?: string;
  additionalComments?: string;
}

// Firebase POST response
interface FirebasePostResponse {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class ParticipantsService {
  private baseDbUrl = 'https://celcium-e4ce3-default-rtdb.firebaseio.com';
  private baseUrl = this.baseDbUrl;
  constructor(private http: HttpClient) {}

   private getUrl(node: string, id?: string): string {
    return id 
      ? `${this.baseDbUrl}/${node}/${id}.json`
      : `${this.baseDbUrl}/${node}.json`;
  }git remote add origin https://github.com/stevecyril45/cbtform.git
  saveRecord<T extends RecordBase>(node: string, record: T): Observable<any> {
    const data = { ...record, date: new Date().toISOString() };
    return this.http.post(this.getUrl(node), data);
  }

  getRecords<T extends RecordBase>(node: string): Observable<T[]> {
    return this.http.get<{ [key: string]: T }>(this.getUrl(node)).pipe(
      map(response => {
        const records: T[] = [];
        for (const key in response) {
          if (response.hasOwnProperty(key)) {
            records.push({ id: key, ...response[key] });
          }
        }
        return records;
      })
    );
  }

   saveParticipant(record: ParticipantRecord): Observable<any> {
    return this.saveRecord('celcium/participants', record);
  }
  getRegistrations(): Observable<ParticipantRecord[]> {
    return this.getRecords<ParticipantRecord>('celcium/participants');
  }
}
