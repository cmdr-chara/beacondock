class AddStatusPageTokenToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :status_page_token, :string
    add_index :users, :status_page_token, unique: true
  end
end
