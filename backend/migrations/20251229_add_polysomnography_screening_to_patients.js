'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add polysomnography column
    await queryInterface.addColumn('Patients', 'polysomnography', {
      type: Sequelize.JSONB,
      defaultValue: {
        ahi: null,
        ahiNrem: null,
        ahiRem: null,
        ahiResidual: null,
        desatIndex: null,
        spo2Min: null,
        spo2Max: null,
        spo2Mean: null,
        t90: null,
        t45: null,
        hypoxicBurden: null
      },
      allowNull: true
    });

    // Add screening column
    await queryInterface.addColumn('Patients', 'screening', {
      type: Sequelize.JSONB,
      defaultValue: {
        sasoForm: null,
        stopBangScore: null,
        epworthScore: null
      },
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns if migration is rolled back
    await queryInterface.removeColumn('Patients', 'polysomnography');
    await queryInterface.removeColumn('Patients', 'screening');
  }
};
