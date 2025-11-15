import React from 'react';

const Projects = () => {
  return (
    <section className="bg-gray-900 text-white py-20">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center">Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-2xl font-bold">Project 1</h3>
            <p className="mt-4">A brief description of the project.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-2xl font-bold">Project 2</h3>
            <p className="mt-4">A brief description of the project.</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <h3 className="text-2xl font-bold">Project 3</h3>
            <p className="mt-4">A brief description of the project.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;
