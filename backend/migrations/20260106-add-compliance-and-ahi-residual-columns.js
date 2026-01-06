'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add cpapComplianceLessThan4hPct column
    await queryInterface.addColumn('Visits', 'cpapComplianceLessThan4hPct', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    // Add cpapComplianceLessThan4h column
    await queryInterface.addColumn('Visits', 'cpapComplianceLessThan4h', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: true
    });

    // Add ahiResidual column
    await queryInterface.addColumn('Visits', 'ahiResidual', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Visits', 'cpapComplianceLessThan4hPct');
    await queryInterface.removeColumn('Visits', 'cpapComplianceLessThan4h');
    await queryInterface.removeColumn('Visits', 'ahiResidual');
  }
};
