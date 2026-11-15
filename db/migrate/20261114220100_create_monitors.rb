class CreateMonitors < ActiveRecord::Migration[8.1]
  def change
    create_table :monitors do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :url, null: false
      t.string :http_method, null: false, default: "GET"
      t.integer :interval_seconds, null: false, default: 300
      t.integer :timeout_seconds, null: false, default: 10
      t.integer :expected_status, null: false, default: 200
      t.integer :warn_latency_ms, null: false, default: 1500
      t.boolean :active, null: false, default: true
      t.integer :last_status, null: false, default: 0
      t.datetime :last_checked_at
      t.integer :consecutive_failures, null: false, default: 0
      t.boolean :public_on_status_page, null: false, default: false
      t.datetime :next_check_at

      t.timestamps
    end

    add_index :monitors, [ :active, :next_check_at ]
  end
end
