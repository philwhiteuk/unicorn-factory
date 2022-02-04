import http from 'k6/http';
import { sleep } from 'k6';

export default function () {
    http.get('http://app:8080/request');
    sleep(Math.floor(Math.random() * 3));
}