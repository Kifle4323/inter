import React from 'react';

const Contact = () => {
  return (
    <section className="bg-gray-800 text-white py-20">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center">Contact</h2>
        <p className="mt-8 text-lg text-center">
          Feel free to reach out to me at <a href="mailto:john.doe@example.com" className="text-blue-400">john.doe@example.com</a>
        </p>
      </div>
    </section>
  );
};

export default Contact;
