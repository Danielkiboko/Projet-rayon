import { sendMobiShastraSMS } from './src/lib/sms';



async function testSMS() {
  console.log('Testing SMS configuration...');
  try {
    const result = await sendMobiShastraSMS({
      mobileNo: '0033600000000', // Dummy number for connection test
      message: 'Test depuis Rayon',
    });
    console.log('API Response:', result);
  } catch (error) {
    console.error('API Error:', error);
  }
}

testSMS();
