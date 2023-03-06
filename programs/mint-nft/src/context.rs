use anchor_lang::{
    prelude::*,
    system_program::System,
};

use crate::instruction;
use crate::{
    state::*,
    constant::*,
};

#[derive(Accounts)]
pub struct CreateMintAccountContext<'info> {
    
    #[account(mut)]
    pub mint: Signer<'info>,

    #[account(mut)]
    pub mint_authority: Signer<'info>,

    /// CHECK: Token program ID (default = TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
    pub token_program: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeMintContext<'info> {
    #[account(mut)]
    pub mint: Signer<'info>,

    #[account(mut)]
    pub mint_authority: Signer<'info>,

    pub rent: Sysvar<'info, Rent>,

    /// CHECK: Token program ID (default = TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
    pub token_program: AccountInfo<'info>,
    
}

#[derive(Accounts)]
pub struct CreateAssociatedTokenAccountContext<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Associated token account init before
    #[account(mut)]
    pub associated_token: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub mint: Signer<'info>,

    pub system_program: Program<'info, System>,

    /// CHECK: Token program ID of Associated token program
    pub associated_token_program: AccountInfo<'info>,

    /// CHECK: Token program ID (default = TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct MintToContext<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub mint: Signer<'info>,

    /// CHECK: Associated token account of user
    #[account(mut)]
    pub token_account: AccountInfo<'info>,

    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: Token program ID (default = TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CreateMetadataAccountsContext<'info> {

    /// CHECK: Metadata account
    #[account(mut)]
    pub metadata_account: AccountInfo<'info>,

    /// CHECK: Mint account according to user
    #[account(mut)]
    pub mint: AccountInfo<'info>,

    #[account(mut)]
    pub mint_authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub update_authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,

    /// CHECK: Metaplex will check this
    pub token_metadata_program: UncheckedAccount<'info>,

}

#[derive(Accounts)]
pub struct CreateMasterEditionAccountContext<'info> {
    
    /// CHECK: Master edition account
    #[account(mut)]
    pub master_edition_account: AccountInfo<'info>,

    /// CHECK: Metadata account
    #[account(mut)]
    pub metadata_account: AccountInfo<'info>,

    /// CHECK: Mint account according to user
    #[account(mut)]
    pub mint: AccountInfo<'info>,

    #[account(mut)]
    pub mint_authority: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub update_authority: Signer<'info>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,

    /// CHECK: Metaplex will check this
    pub token_metadata_program: UncheckedAccount<'info>,

    /// CHECK: Token program ID (default = TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
    pub token_program: AccountInfo<'info>,
}