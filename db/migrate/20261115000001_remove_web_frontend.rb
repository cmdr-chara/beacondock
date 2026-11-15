# The app went API-only: sessions, password auth, status page token and the
# public-page flag belonged to the removed web frontend.
class RemoveWebFrontend < ActiveRecord::Migration[8.1]
  def change
    drop_table :sessions do |t|
      t.integer :user_id, null: false
      t.string :ip_address
      t.string :user_agent
      t.timestamps
      t.index [ :user_id ]
    end

    remove_column :users, :password_digest, :string, null: false
    remove_column :users, :status_page_token, :string
    remove_column :monitors, :public_on_status_page, :boolean, null: false, default: false
  end
end
