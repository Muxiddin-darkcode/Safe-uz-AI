import fetch from 'node-fetch';

async function getServiceAccount() {
  try {
    const response = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email', {
      headers: { 'Metadata-Flavor': 'Google' }
    });
    if (response.ok) {
      const email = await response.text();
      console.log("Service Account Email:", email);
    } else {
      console.log("Failed to get metadata. Status:", response.status);
    }
  } catch (error) {
    console.error("Error fetching metadata:", error);
  }
}

getServiceAccount();
