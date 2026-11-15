class CreateChecks < ActiveRecord::Migration[8.1]
  def change
    create_table :checks do |t|
      t.references :monitor, null: false, foreign_key: true
      t.integer :status, null: false
      t.integer :http_status
      t.float :latency_ms
      t.string :error
      t.datetime :checked_at, null: false

      t.timestamps
    end

    add_index :checks, [ :monitor_id, :checked_at ]
    add_index :checks, :checked_at
  end
end
