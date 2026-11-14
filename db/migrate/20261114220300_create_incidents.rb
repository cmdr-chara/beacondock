class CreateIncidents < ActiveRecord::Migration[8.1]
  def change
    create_table :incidents do |t|
      t.references :monitor, null: false, foreign_key: true
      t.datetime :started_at, null: false
      t.datetime :resolved_at
      t.string :cause

      t.timestamps
    end

    add_index :incidents, [ :monitor_id, :resolved_at ]
  end
end
